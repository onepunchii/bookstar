// 원클릭 수신거부 — 이메일 푸터 링크. 토큰만 알면 인증 없이 즉시 처리 (법적 요건).
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t");
  let ok = false;
  if (token && /^[0-9a-f-]{36}$/.test(token)) {
    try {
      const db = getDb();
      const updated = await db
        .update(schema.outreachContacts)
        .set({ status: "unsubscribed" })
        .where(eq(schema.outreachContacts.unsubToken, token))
        .returning({ id: schema.outreachContacts.id });
      ok = updated.length > 0;
    } catch {
      ok = false;
    }
  }

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>수신거부</title></head>
<body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0b;color:rgba(255,255,255,0.92);font-family:'Apple SD Gothic Neo',sans-serif;text-align:center;">
<div><div style="font-size:22px;font-weight:800;margin-bottom:10px;">XO<span style="color:#FF5A00">NG</span></div>
<p style="color:rgba(255,255,255,0.58);font-size:15px;">${
    ok
      ? "수신거부가 처리되었습니다. 더 이상 메일을 보내지 않습니다."
      : "이미 처리되었거나 유효하지 않은 링크입니다."
  }</p></div></body></html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
