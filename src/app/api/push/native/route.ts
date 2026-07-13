// 네이티브 앱(Capacitor) 푸시 토큰 등록 — shell-kit 표준 (onp 이식).
// 로그인 사용자면 userId 연결, 아니면 익명 등록.
import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { token?: unknown; platform?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  const token = String(body.token ?? "").trim();
  const platform = String(body.platform ?? "");
  if (!token || token.length > 4096) return NextResponse.json({ error: "BAD_TOKEN" }, { status: 400 });
  if (platform !== "android" && platform !== "ios") return NextResponse.json({ error: "BAD_PLATFORM" }, { status: 400 });
  try {
    const session = await auth();
    const sql = neon(process.env.DATABASE_URL!);
    await sql`INSERT INTO native_push_tokens (token, user_id, platform) VALUES (${token}, ${session?.user?.id ?? null}, ${platform})
      ON CONFLICT (token) DO UPDATE SET platform = ${platform}, user_id = COALESCE(${session?.user?.id ?? null}, native_push_tokens.user_id)`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[push/native]", (e as Error)?.message);
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}
