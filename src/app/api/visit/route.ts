import { NextResponse } from "next/server";
import { recordVisit } from "@/lib/visits";

export const dynamic = "force-dynamic";

// POST /api/visit { visitor } — 일별 유니크 접속자 비콘. 로그인 여부와 무관하다.
//
// 클라이언트(components/visit-beacon.tsx)가 **하루 한 번만** 호출한다. 그래서 이 라우트는
// 트래픽이 아니라 "그날 온 사람 수"만큼 호출된다.

// 발신자(IP)별 고정창 레이트리밋 — 난수 ID 반복 전송으로 수치를 부풀리는 것을 막는다.
// 완벽한 방어는 아니지만(내부 대시보드용 지표라 그 정도면 충분하다) 실수·장난 수준은 걸러진다.
// api/errors/route.ts 와 같은 인스턴스 내 베스트에포트 패턴.
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
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

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip, Date.now()))
    return NextResponse.json({ ok: false }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const v = String(body.visitor ?? body.v ?? "").trim();
  if (!v) return NextResponse.json({ ok: false }, { status: 400 });

  // 실패해도 200 으로 답한다 — 클라이언트가 재시도하거나 콘솔에 에러를 뿌릴 이유가 없다.
  // 집계가 안 되는 상황은 대시보드 쪽에서 "미설정"으로 드러난다(lib/visits.ts 의 null 처리).
  await recordVisit(v);
  return NextResponse.json({ ok: true });
}
