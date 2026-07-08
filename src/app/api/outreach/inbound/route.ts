// 인바운드 답장 웹훅 — 답장 저장 → 컨택트 replied 처리 → Claude 초안 생성(승인 대기).
// Resend Inbound(또는 동급 서비스)의 수신 웹훅을 이 URL로 등록: /api/outreach/inbound?key=...
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { classifyAndDraft } from "@/lib/outreach/draft";

function extractEmail(raw: unknown): string | null {
  if (typeof raw !== "string") {
    if (raw && typeof raw === "object" && "email" in raw) {
      return extractEmail((raw as { email: unknown }).email);
    }
    return null;
  }
  const m = raw.match(/[^\s<>"']+@[^\s<>"']+\.[^\s<>"']+/);
  return m ? m[0].toLowerCase() : null;
}

export async function POST(req: Request) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.OUTREACH_WEBHOOK_KEY || key !== process.env.OUTREACH_WEBHOOK_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = (await req.json().catch(() => null)) as {
    data?: Record<string, unknown>;
  } | null;
  const d = (payload?.data ?? payload ?? {}) as Record<string, unknown>;

  const fromEmail = extractEmail(d.from);
  const subject = typeof d.subject === "string" ? d.subject : null;
  const body =
    typeof d.text === "string" && d.text.trim()
      ? d.text
      : typeof d.html === "string"
        ? d.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : "";

  if (!fromEmail || !body) return NextResponse.json({ ok: true });

  const db = getDb();
  const [contact] = await db
    .select()
    .from(schema.outreachContacts)
    .where(eq(schema.outreachContacts.email, fromEmail))
    .limit(1);

  // 답장 오면 자동발송 영구 중단
  if (contact) {
    await db
      .update(schema.outreachContacts)
      .set({ status: "replied" })
      .where(eq(schema.outreachContacts.id, contact.id));
  }

  // AI 분류·초안 — 실패해도 답장 자체는 저장
  let ai = null;
  try {
    ai = await classifyAndDraft({
      segment: contact?.segment ?? null,
      org: contact?.org ?? null,
      name: contact?.name ?? null,
      subject,
      body,
    });
  } catch {
    ai = null;
  }

  await db.insert(schema.outreachReplies).values({
    contactId: contact?.id ?? null,
    fromEmail,
    subject,
    body: body.slice(0, 20000),
    intent: ai?.intent ?? null,
    summary: ai?.summary ?? null,
    draft: ai?.draft ?? null,
  });

  return NextResponse.json({ ok: true, drafted: !!ai });
}
