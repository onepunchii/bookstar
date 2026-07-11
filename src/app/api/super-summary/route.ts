import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// 슈퍼관리자 요약 — 외부 통합 대시보드용 스냅샷.
// 세션 대신 Bearer 시크릿(SUPER_ADMIN_SECRET)으로만 인증. 캐시 금지.
export const dynamic = "force-dynamic";

const count = sql<number>`count(*)::int`;
// "오늘/24h" 기준 통일 — now() - interval '1 day'
const dayAgo = sql`now() - interval '1 day'`;

// 개별 집계 실패가 전체 응답을 무너뜨리지 않도록 — 실패 시 0으로 채운다.
async function safeCount(
  run: () => Promise<{ c: number }[]>
): Promise<number> {
  try {
    return Number((await run())[0]?.c ?? 0);
  } catch (e) {
    console.error("[super-summary]", e);
    return 0;
  }
}

// 목록 조회도 같은 원칙 — 실패하면 빈 배열로 응답을 지킨다.
async function safeList<T>(run: () => Promise<T[]>): Promise<T[]> {
  try {
    return await run();
  } catch (e) {
    console.error("[super-summary]", e);
    return [];
  }
}

// 개인 식별정보 마스킹 — 이메일·전화번호·UUID를 지우고 120자로 자른다.
// 건의/에러 내용 자체는 보여주되 식별자는 대시보드로 내보내지 않는다.
function sanitize(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, "[이메일]")
    .replace(/(\+82[- ]?|0)\d{1,2}[- .]?\d{3,4}[- .]?\d{4}/g, "[전화]")
    .replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      "[ID]"
    )
    .trim()
    .slice(0, 120);
}

export async function GET(req: Request) {
  // 인증은 엄격히 — 시크릿 미설정이거나 헤더 불일치면 무조건 401.
  const secret = process.env.SUPER_ADMIN_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = getDb();
  // ?detail=1 — 통합 대시보드에서 건의·에러 목록까지 볼 때만 추가 조회
  const detail = new URL(req.url).searchParams.get("detail") === "1";

  const [
    usersTotal,
    usersToday,
    artistsTotal,
    agenciesTotal,
    advertisersTotal,
    bookings24h,
    bookingsPending,
    feedbackNew,
    agenciesVerifyPending,
    repliesPending,
    errors24h,
  ] = await Promise.all([
    safeCount(() => db.select({ c: count }).from(schema.users)),
    safeCount(() =>
      db
        .select({ c: count })
        .from(schema.users)
        .where(sql`${schema.users.createdAt} >= ${dayAgo}`)
    ),
    safeCount(() => db.select({ c: count }).from(schema.artists)),
    safeCount(() => db.select({ c: count }).from(schema.agencies)),
    // 광고주 = role 'company' 사용자(섭외를 의뢰하는 개인·브랜드)
    safeCount(() =>
      db
        .select({ c: count })
        .from(schema.users)
        .where(sql`${schema.users.role} = 'company'`)
    ),
    safeCount(() =>
      db
        .select({ c: count })
        .from(schema.bookingRequests)
        .where(sql`${schema.bookingRequests.createdAt} >= ${dayAgo}`)
    ),
    // 미확정 섭외 — 소속사 회신을 기다리는 요청
    safeCount(() =>
      db
        .select({ c: count })
        .from(schema.bookingRequests)
        .where(sql`${schema.bookingRequests.status} = 'pending'`)
    ),
    // 건의함 미처리
    safeCount(() =>
      db
        .select({ c: count })
        .from(schema.feedbacks)
        .where(sql`${schema.feedbacks.status} = 'new'`)
    ),
    // 소속사 인증 심사 대기
    safeCount(() =>
      db
        .select({ c: count })
        .from(schema.agencies)
        .where(sql`${schema.agencies.verificationStatus} = 'pending'`)
    ),
    // 아웃리치 답장 — AI 초안 승인 대기
    safeCount(() =>
      db
        .select({ c: count })
        .from(schema.outreachReplies)
        .where(sql`${schema.outreachReplies.status} = 'pending'`)
    ),
    // 최근 24시간 내 발생(lastSeen)한 에러 그룹 수
    safeCount(() =>
      db
        .select({ c: count })
        .from(schema.errorLogs)
        .where(sql`${schema.errorLogs.lastSeen} >= ${dayAgo}`)
    ),
  ]);

  const body: Record<string, unknown> = {
    ts: new Date().toISOString(),
    members: { total: usersTotal, today: usersToday },
    metrics: [
      { label: "아티스트", value: artistsTotal },
      { label: "소속사", value: agenciesTotal },
      { label: "광고주", value: advertisersTotal },
      { label: "24시간 섭외 요청", value: bookings24h },
    ],
    pending: [
      { label: "섭외 대기", count: bookingsPending },
      { label: "건의 미처리", count: feedbackNew },
      { label: "소속사 인증 대기", count: agenciesVerifyPending },
      { label: "아웃리치 답장 승인 대기", count: repliesPending },
    ].filter((p) => p.count > 0),
    errors24h,
  };

  if (detail) {
    // 건의함 최근 10건 — 최신순, done=처리 완료 여부
    const [feedbackRows, errorRows] = await Promise.all([
      safeList(() =>
        db
          .select({
            when: schema.feedbacks.createdAt,
            text: schema.feedbacks.body,
            status: schema.feedbacks.status,
          })
          .from(schema.feedbacks)
          .orderBy(desc(schema.feedbacks.createdAt))
          .limit(10)
      ),
      // 에러 최근 10그룹 — fingerprint 단위로 이미 그룹핑되어 count 누적됨
      safeList(() =>
        db
          .select({
            when: schema.errorLogs.lastSeen,
            message: schema.errorLogs.message,
            count: schema.errorLogs.count,
          })
          .from(schema.errorLogs)
          .orderBy(desc(schema.errorLogs.lastSeen))
          .limit(10)
      ),
    ]);

    body.feedbackRecent = feedbackRows.map((r) => ({
      when: r.when.toISOString(),
      text: sanitize(r.text),
      done: r.status === "done",
    }));
    body.errorRecent = errorRows.map((r) => ({
      when: r.when.toISOString(),
      message: sanitize(r.message),
      count: r.count,
    }));
  }

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
