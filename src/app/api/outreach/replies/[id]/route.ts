// 답장 승인·발송 / 무시 — 관리자 전용.
// POST { action: "approve", draft } → 수정된 초안을 실제 발송
// POST { action: "dismiss" } → 무시 처리
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/data/session";
import { sendEmail } from "@/lib/outreach/resend";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "관리자 전용" }, { status: 403 });
  }
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    action?: "approve" | "dismiss";
    draft?: string;
  };

  const db = getDb();
  const [reply] = await db
    .select()
    .from(schema.outreachReplies)
    .where(eq(schema.outreachReplies.id, id))
    .limit(1);
  if (!reply) return NextResponse.json({ error: "없음" }, { status: 404 });
  if (reply.status !== "pending") {
    return NextResponse.json({ error: "이미 처리됨" }, { status: 409 });
  }

  if (body.action === "dismiss") {
    await db
      .update(schema.outreachReplies)
      .set({ status: "dismissed" })
      .where(eq(schema.outreachReplies.id, id));
    return NextResponse.json({ ok: true });
  }

  if (body.action === "approve") {
    const finalDraft = (body.draft ?? reply.draft ?? "").trim();
    if (!finalDraft) {
      return NextResponse.json({ error: "초안이 비어 있음" }, { status: 400 });
    }
    const subject = reply.subject
      ? reply.subject.startsWith("Re:")
        ? reply.subject
        : `Re: ${reply.subject}`
      : "Re: xong 문의 주셔서 감사합니다";

    // 답장은 플레인 텍스트 위주 — 스팸 점수 낮고 사람 냄새가 남
    const html = `<div style="font-family:'Apple SD Gothic Neo',sans-serif;font-size:14px;line-height:1.8;color:#222;white-space:pre-wrap;">${finalDraft
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")}</div>`;

    await sendEmail({
      to: reply.fromEmail,
      subject,
      html,
      text: finalDraft,
    });

    await db
      .update(schema.outreachReplies)
      .set({ status: "approved", sentReply: finalDraft, sentAt: new Date() })
      .where(eq(schema.outreachReplies.id, id));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "action 필요" }, { status: 400 });
}
