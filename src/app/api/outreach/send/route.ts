// 발송 큐 실행 — 우선순위(엔터>유튜버>기업)순으로 배치 발송.
// GET: Vercel Cron (Authorization: Bearer CRON_SECRET 자동 첨부)
// POST: 관리자 수동 발송 ({ limit })
// 규칙: 1차 발송 → 4일 후 무응답이면 리마인드 1회 → 끝. 수신거부·반송·답장은 영구 제외.
//
// 동시성 안전:
// 1) 후보를 SELECT하지 않고, 원자적으로 status='sending'으로 선점(FOR UPDATE SKIP LOCKED).
//    → 크론과 수동 발송(또는 두 번 클릭)이 겹쳐도 같은 행을 두 번 집지 않아 중복 발송 없음.
// 2) 발송 직전 상태 재확인 + 최종 업데이트를 status='sending' 조건부로 실행.
//    → 배치 도중 수신거부/답장/반송이 들어오면 그 상태를 덮어쓰지 않고 발송도 건너뜀.
// 3) 죽은 배치가 남긴 'sending' 행은 15분 후 재선점(발송 누락 방지).
import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/data/session";
import { sendEmail, siteUrl } from "@/lib/outreach/resend";
import { buildOutreachEmail, type OutreachSegment } from "@/lib/outreach/templates";

// Vercel 함수 최대 실행 시간(플랫폼 상한까지 사용 — Hobby는 60s로 클램프됨)
export const maxDuration = 60;

const DAILY_CAP = 100; // Resend 무료 한도. 웜업 관점에서도 상한 유지.
const REMIND_AFTER_MS = 4 * 24 * 60 * 60 * 1000;
const STALE_SENDING_MS = 15 * 60 * 1000; // 죽은 배치가 남긴 'sending' 재선점 기준

interface ClaimedRow {
  id: string;
  email: string;
  name: string | null;
  org: string | null;
  segment: string;
  sent_count: number;
  unsub_token: string;
}

async function runBatch(limit: number) {
  const db = getDb();
  const n = Math.max(0, Math.min(limit, DAILY_CAP));
  if (n === 0) return { claimed: 0, sent: 0, errors: [] as string[] };

  const remindBefore = new Date(Date.now() - REMIND_AFTER_MS);
  const staleBefore = new Date(Date.now() - STALE_SENDING_MS);

  // ── 원자적 선점: 후보를 잠그고 즉시 'sending'으로 플립 ──
  const claimRes = await db.execute(sql`
    UPDATE outreach_contacts
    SET status = 'sending', last_sent_at = now()
    WHERE id IN (
      SELECT id FROM outreach_contacts
      WHERE status = 'queued'
         OR (status IN ('sent','opened') AND sent_count = 1 AND last_sent_at < ${remindBefore})
         OR (status = 'sending' AND last_sent_at < ${staleBefore})
      ORDER BY priority DESC, created_at ASC
      LIMIT ${n}
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, email, name, org, segment, sent_count, unsub_token
  `);
  const claimed = ((claimRes as { rows?: unknown[] }).rows ??
    (claimRes as unknown as unknown[])) as ClaimedRow[];

  let sent = 0;
  const errors: string[] = [];

  for (const c of claimed) {
    const reminder = c.sent_count >= 1;

    // 발송 직전 재확인 — 선점 이후 수신거부/답장/반송이 들어왔으면 건너뜀
    const [fresh] = await db
      .select({ status: schema.outreachContacts.status })
      .from(schema.outreachContacts)
      .where(eq(schema.outreachContacts.id, c.id))
      .limit(1);
    if (!fresh || fresh.status !== "sending") continue;

    try {
      const email = buildOutreachEmail(c.segment as OutreachSegment, {
        name: c.name,
        org: c.org,
        unsubToken: c.unsub_token,
        reminder,
      });
      const messageId = await sendEmail({
        to: c.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: {
          "List-Unsubscribe": `<${siteUrl()}/api/outreach/unsubscribe?t=${c.unsub_token}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });
      // 조건부 확정: 여전히 'sending'일 때만 → 그 사이 들어온 수신거부/답장을 덮지 않음
      await db
        .update(schema.outreachContacts)
        .set({
          status: "sent",
          sentCount: c.sent_count + 1,
          lastSentAt: new Date(),
          resendMessageId: messageId,
        })
        .where(
          and(
            eq(schema.outreachContacts.id, c.id),
            eq(schema.outreachContacts.status, "sending")
          )
        );
      sent += 1;
      await new Promise((r) => setTimeout(r, 600)); // Resend rate limit(2req/s) 여유
    } catch (e) {
      errors.push(`${c.email}: ${(e as Error).message}`);
      await db
        .update(schema.outreachContacts)
        .set({ status: "failed" })
        .where(
          and(
            eq(schema.outreachContacts.id, c.id),
            eq(schema.outreachContacts.status, "sending")
          )
        );
      if ((e as Error).message.includes("429")) break; // 한도 초과면 배치 중단
    }
  }

  return { claimed: claimed.length, sent, errors };
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runBatch(40); // 60s 안에 안전하게 끝나는 배치 크기
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "관리자 전용" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { limit?: number };
  const result = await runBatch(body.limit ?? 40);
  return NextResponse.json(result);
}
