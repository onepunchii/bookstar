// 템플릿 테스트 발송 — 관리자가 지정한 주소로 1통. 연락처 테이블은 건드리지 않는다.
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/data/admin";
import { sendEmail } from "@/lib/outreach/resend";
import {
  buildOutreachEmail,
  type OutreachSegment,
} from "@/lib/outreach/templates";

const SAMPLE: Record<OutreachSegment, { name: string | null; org: string | null }> = {
  agency: { name: null, org: "샘플엔터테인먼트" },
  creator: { name: "크리에이터", org: null },
  company: { name: null, org: "샘플마케팅" },
};

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "관리자 전용" }, { status: 403 });
  }
  const body = (await req.json().catch(() => ({}))) as {
    segment?: string;
    to?: string;
    reminder?: boolean;
  };
  const segment = body.segment as OutreachSegment;
  const to = body.to?.trim().toLowerCase() ?? "";
  if (!["agency", "creator", "company"].includes(segment)) {
    return NextResponse.json({ error: "segment 오류" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "이메일 형식 오류" }, { status: 400 });
  }

  const email = buildOutreachEmail(segment, {
    ...SAMPLE[segment],
    unsubToken: "00000000-0000-0000-0000-000000000000", // 더미 — 테스트 메일의 수신거부는 무효 링크
    reminder: body.reminder,
  });
  await sendEmail({
    to,
    subject: `[테스트] ${email.subject}`,
    html: email.html,
    text: email.text,
  });
  return NextResponse.json({ ok: true, subject: email.subject });
}
