import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";

// 소속사로 시작 — 로그인 유저 소유의 소속사 생성 + 역할 부여.
// 이후 소속사 콘솔이 데모 대신 본인(빈) 데이터로 스코프된다.
export async function POST(req: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  try {
    const body = (await req.json().catch(() => ({}))) as {
      companyName?: string;
    };
    const db = getDb();
    // 이미 소속사가 있으면 그대로
    const [existing] = await db
      .select({ id: schema.agencies.id })
      .from(schema.agencies)
      .where(eq(schema.agencies.ownerId, uid))
      .limit(1);
    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id, already: true });
    }
    const companyName =
      body.companyName?.trim() || `${session.user?.name ?? "내"} 엔터테인먼트`;
    const [agency] = await db
      .insert(schema.agencies)
      .values({ ownerId: uid, companyName, verified: false })
      .returning({ id: schema.agencies.id });
    await db
      .update(schema.users)
      .set({ role: "agency", company: companyName })
      .where(eq(schema.users.id, uid));
    revalidatePath("/agency");
    revalidatePath("/agency/artists");
    return NextResponse.json({ ok: true, id: agency.id });
  } catch (e) {
    console.error("[join agency]", e);
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }
}
