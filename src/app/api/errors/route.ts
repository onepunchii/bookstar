import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { captureError } from "@/lib/error-log";
import { sessionUserExists } from "@/lib/data/session";

const UUID = /^[0-9a-f-]{36}$/;

// 클라이언트 런타임 에러 수집 — 비로그인도 허용. 항상 204(수집 실패가 앱을 흔들지 않도록).
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as {
      message?: string;
      stack?: string;
      digest?: string;
      url?: string;
    };
    const message = b.message?.trim();
    if (!message) return new NextResponse(null, { status: 204 });

    const session = await auth();
    const uid = session?.user?.id;
    const userId =
      uid && UUID.test(uid) && (await sessionUserExists(uid)) ? uid : null;

    await captureError({
      source: "client",
      message,
      stack: b.stack ?? null,
      digest: b.digest ?? null,
      url: b.url ?? null,
      method: "client",
      userId,
      userAgent: req.headers.get("user-agent"),
    });
  } catch {
    /* 무시 */
  }
  return new NextResponse(null, { status: 204 });
}
