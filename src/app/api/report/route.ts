// 콘텐츠 신고 — App Store 1.2 UGC 요건 (onp/mapix 검증 패턴).
// 공개 프로필·협의 채팅·사용자를 앱 안에서 즉시 신고. 어드민이 24시간 내 검토(약관 약속).
import { NextRequest, NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/data/session";

export const runtime = "nodejs";

const TARGET_TYPES = new Set(["artist_profile", "chat", "user"]);

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  let body: { targetType?: unknown; targetId?: unknown; reason?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  const targetType = String(body.targetType ?? "");
  const targetId = String(body.targetId ?? "").slice(0, 200);
  const reason = String(body.reason ?? "").slice(0, 500) || null;
  if (!TARGET_TYPES.has(targetType) || !targetId) {
    return NextResponse.json({ error: "BAD_TARGET" }, { status: 400 });
  }
  try {
    const db = getDb();
    await db.insert(schema.contentReports).values({
      reporterId: user.id,
      targetType,
      targetId,
      reason,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[report]", (e as Error)?.message);
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}
