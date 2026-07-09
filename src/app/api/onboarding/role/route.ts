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
    // 관리자 역할은 온보딩 선택으로 강등하지 않음(onboarded만 완료 처리)
    const [cur] = await db
      .select({ role: schema.users.role })
      .from(schema.users)
      .where(eq(schema.users.id, uid))
      .limit(1);
    await db
      .update(schema.users)
      .set(cur?.role === "admin" ? { onboarded: true } : { onboarded: true, role: next })
      .where(eq(schema.users.id, uid));
    return NextResponse.json({ ok: true, role: cur?.role === "admin" ? "admin" : next });
  } catch (e) {
    console.error("[onboarding role]", e);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
