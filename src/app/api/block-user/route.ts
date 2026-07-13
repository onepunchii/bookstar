// 사용자 차단 — App Store 1.2 UGC 요건 (onp/mapix 검증 패턴).
// 차단하면 상대와의 협의 채팅 전송이 양방향으로 막힌다.
import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/data/session";

export const runtime = "nodejs";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  let body: { userId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "BAD_REQUEST" }, { status: 400 });
  }
  const blockedId = String(body.userId ?? "");
  if (!UUID_RE.test(blockedId)) {
    return NextResponse.json({ error: "BAD_USER" }, { status: 400 });
  }
  if (blockedId === user.id) {
    return NextResponse.json({ error: "SELF" }, { status: 400 });
  }
  try {
    const db = getDb();
    await db
      .insert(schema.blockedUsers)
      .values({ blockerId: user.id, blockedId })
      .onConflictDoNothing();
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[block-user]", (e as Error)?.message);
    return NextResponse.json({ error: "FAILED" }, { status: 500 });
  }
}

// 차단 해제 — ?userId=
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  const blockedId = req.nextUrl.searchParams.get("userId") ?? "";
  if (!UUID_RE.test(blockedId)) {
    return NextResponse.json({ error: "BAD_USER" }, { status: 400 });
  }
  const db = getDb();
  await db
    .delete(schema.blockedUsers)
    .where(
      and(
        eq(schema.blockedUsers.blockerId, user.id),
        eq(schema.blockedUsers.blockedId, blockedId)
      )
    );
  return NextResponse.json({ ok: true });
}

// 내 차단 목록 (설정 화면용)
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  const db = getDb();
  const rows = await db
    .select({
      userId: schema.blockedUsers.blockedId,
      name: schema.users.name,
      createdAt: schema.blockedUsers.createdAt,
    })
    .from(schema.blockedUsers)
    .leftJoin(schema.users, eq(schema.blockedUsers.blockedId, schema.users.id))
    .where(eq(schema.blockedUsers.blockerId, user.id));
  return NextResponse.json({ blocked: rows });
}
