import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
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

export async function GET(req: Request) {
  // 인증은 엄격히 — 시크릿 미설정이거나 헤더 불일치면 무조건 401.
  const secret = process.env.SUPER_ADMIN_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = getDb();

  const [
    usersTotal,
    usersToday,
    artistsTotal,
    agenciesTotal,
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

  return NextResponse.json(
    {
      ts: new Date().toISOString(),
      members: { total: usersTotal, today: usersToday },
      metrics: [
        { label: "아티스트", value: artistsTotal },
        { label: "소속사", value: agenciesTotal },
        { label: "24시간 섭외 요청", value: bookings24h },
      ],
      pending: [
        { label: "섭외 대기", count: bookingsPending },
        { label: "건의 미처리", count: feedbackNew },
        { label: "소속사 인증 대기", count: agenciesVerifyPending },
        { label: "아웃리치 답장 승인 대기", count: repliesPending },
      ].filter((p) => p.count > 0),
      errors24h,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
