import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";

const UUID = /^[0-9a-f-]{36}$/;

// 최초 로그인 후 역할 선택 확정 — onboarded=true + role.
// company(광고주)는 즉시 완료, agency(소속사)는 인증 셋업으로 이어짐.
export async function POST(req: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid || !UUID.test(uid))
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  try {
    const { role } = (await req.json()) as { role?: string };
    const next = role === "agency" ? "agency" : "company";
    const db = getDb();
    const [cur] = await db
      .select({ role: schema.users.role, onboarded: schema.users.onboarded })
      .from(schema.users)
      .where(eq(schema.users.id, uid))
      .limit(1);
    // 확정 역할(admin·artist)은 강등하지 않고, 이미 온보딩 완료면 role 고정.
    // 최초 온보딩(onboarded=false, company)일 때만 선택한 role로 설정.
    const keepRole =
      cur?.role === "admin" || cur?.role === "artist" || cur?.onboarded === true;
    await db
      .update(schema.users)
      .set(keepRole ? { onboarded: true } : { onboarded: true, role: next })
      .where(eq(schema.users.id, uid));
    return NextResponse.json({ ok: true, role: keepRole ? cur?.role : next });
  } catch (e) {
    console.error("[onboarding role]", e);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
