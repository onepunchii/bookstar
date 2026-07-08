// Resend 이벤트 웹훅 — 열람·반송·스팸신고를 상태에 반영.
// 보안: URL 쿼리 ?key=OUTREACH_WEBHOOK_KEY 로 검증 (Resend 대시보드에 키 포함 URL 등록).
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function POST(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.OUTREACH_WEBHOOK_KEY || key !== process.env.OUTREACH_WEBHOOK_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const event = (await req.json().catch(() => null)) as {
    type?: string;
    data?: { email_id?: string };
  } | null;
  const emailId = event?.data?.email_id;
  if (!event?.type || !emailId) return NextResponse.json({ ok: true });

  const db = getDb();
  const [contact] = await db
    .select()
    .from(schema.outreachContacts)
    .where(eq(schema.outreachContacts.resendMessageId, emailId))
    .limit(1);
  if (!contact) return NextResponse.json({ ok: true });

  // replied/unsubscribed는 최종 상태 — 이벤트로 되돌리지 않는다
  const terminal = ["replied", "unsubscribed", "bounced"];
  let next: "opened" | "bounced" | "unsubscribed" | null = null;
  if (event.type === "email.opened" && !terminal.includes(contact.status)) next = "opened";
  if (event.type === "email.bounced") next = "bounced";
  if (event.type === "email.complained") next = "unsubscribed"; // 스팸 신고 = 영구 제외

  if (next) {
    await db
      .update(schema.outreachContacts)
      .set({ status: next })
      .where(eq(schema.outreachContacts.id, contact.id));
  }
  return NextResponse.json({ ok: true });
}
