// Resend 발송 래퍼 — SDK 의존성 없이 REST 직접 호출 (무료: 100통/일, 3,000통/월)
// 필요 env: RESEND_API_KEY, OUTREACH_FROM (예: "XONG <hello@mail.xong.kr>")

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export async function sendEmail(input: SendEmailInput): Promise<string> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.OUTREACH_FROM;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY / OUTREACH_FROM 환경변수가 필요합니다");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
      reply_to: input.replyTo,
      headers: input.headers,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

// 인바운드 메일 본문 조회 — email.received 웹훅은 메타데이터만 주므로 본문은 이 API로 가져온다
export async function fetchReceivedEmail(emailId: string): Promise<{
  from: string | null;
  subject: string | null;
  text: string | null;
  html: string | null;
} | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  const res = await fetch(
    `https://api.resend.com/emails/receiving/${encodeURIComponent(emailId)}`,
    { headers: { Authorization: `Bearer ${apiKey}` } }
  );
  if (!res.ok) return null;
  const d = (await res.json()) as {
    from?: string;
    subject?: string;
    text?: string;
    html?: string;
  };
  return {
    from: d.from ?? null,
    subject: d.subject ?? null,
    text: d.text ?? null,
    html: d.html ?? null,
  };
}

export function siteUrl(): string {
  return (
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://xong.kr"
  );
}
