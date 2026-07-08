// 발송 큐 실행 — 우선순위(엔터>유튜버>기업)순으로 배치 발송.
// GET: Vercel Cron (Authorization: Bearer CRON_SECRET 자동 첨부)
// POST: 관리자 수동 발송 ({ limit })
// 규칙: 1차 발송 → 4일 후 무응답이면 리마인드 1회 → 끝. 수신거부·반송·답장은 영구 제외.
import { NextResponse } from "next/server";
import { and, asc, desc, eq, inArray, lt, or } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/data/session";
import { sendEmail, siteUrl } from "@/lib/outreach/resend";
import { buildOutreachEmail, type OutreachSegment } from "@/lib/outreach/templates";

const DAILY_CAP = 100; // Resend 무료 한도. 웜업 관점에서도 상한 유지.
const REMIND_AFTER_MS = 4 * 24 * 60 * 60 * 1000;

async function runBatch(limit: number) {
  const db = getDb();
  const remindBefore = new Date(Date.now() - REMIND_AFTER_MS);

  const candidates = await db
    .select()
    .from(schema.outreachContacts)
    .where(
      or(
        eq(schema.outreachContacts.status, "queued"),
        and(
          inArray(schema.outreachContacts.status, ["sent", "opened"]),
          eq(schema.outreachContacts.sentCount, 1),
          lt(schema.outreachContacts.lastSentAt, remindBefore)
        )
      )
    )
    .orderBy(
      desc(schema.outreachContacts.priority),
      asc(schema.outreachContacts.createdAt)
    )
    .limit(Math.min(limit, DAILY_CAP));

  let sent = 0;
  const errors: string[] = [];

  for (const contact of candidates) {
    const reminder = contact.sentCount >= 1;
    try {
      const email = buildOutreachEmail(contact.segment as OutreachSegment, {
        name: contact.name,
        org: contact.org,
        unsubToken: contact.unsubToken,
        reminder,
      });
      const messageId = await sendEmail({
        to: contact.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
        headers: {
          "List-Unsubscribe": `<${siteUrl()}/api/outreach/unsubscribe?t=${contact.unsubToken}>`,
        },
      });
      await getDb()
        .update(schema.outreachContacts)
        .set({
          status: "sent",
          sentCount: contact.sentCount + 1,
          lastSentAt: new Date(),
          resendMessageId: messageId,
        })
        .where(eq(schema.outreachContacts.id, contact.id));
      sent += 1;
      // Resend rate limit(2req/s) 여유
      await new Promise((r) => setTimeout(r, 600));
    } catch (e) {
      errors.push(`${contact.email}: ${(e as Error).message}`);
      await getDb()
        .update(schema.outreachContacts)
        .set({ status: "failed" })
        .where(eq(schema.outreachContacts.id, contact.id));
      // 429/한도 초과 계열이면 배치 중단
      if ((e as Error).message.includes("429")) break;
    }
  }

  return { candidates: candidates.length, sent, errors };
}

export async function GET(req: Request) {
  // Vercel Cron 인증
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const result = await runBatch(50);
  return NextResponse.json(result);
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "관리자 전용" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as { limit?: number };
  const result = await runBatch(body.limit ?? 50);
  return NextResponse.json(result);
}
