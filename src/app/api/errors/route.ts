import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { captureError } from "@/lib/error-log";
import { sessionUserExists } from "@/lib/data/session";

const UUID = /^[0-9a-f-]{36}$/;

// 발신자(IP)별 고정창 레이트리밋 — 인스턴스 내 베스트에포트(무제한 플러딩으로 error_logs 폭주 방지).
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;
const hits = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string, now: number): boolean {
  const e = hits.get(ip);
  if (!e || now > e.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 5000) {
      // 메모리 상한 — 만료 항목 정리
      for (const [k, v] of hits) if (now > v.resetAt) hits.delete(k);
    }
    return false;
  }
  e.count += 1;
  return e.count > MAX_PER_WINDOW;
}

// 클라이언트 런타임 에러 수집 — 비로그인도 허용. 항상 204(수집 실패가 앱을 흔들지 않도록).
export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip, Date.now())) return new NextResponse(null, { status: 204 });
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
