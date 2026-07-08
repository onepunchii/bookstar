import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";

// 소속사 계정 프로필 수정. 유형(1인/대형)에 따라 요금제 자동 설정.
interface Body {
  companyName?: string;
  agencyType?: "solo" | "company";
  manager?: string | null;
  phone?: string | null;
  email?: string | null;
}

// 1인 기획사/유튜버 = 무료, 대형 기획사 = 유료(엔터프라이즈)
function planFor(type: string): string {
  return type === "company" ? "enterprise" : "free";
}

export async function POST(req: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  try {
    const b = (await req.json()) as Body;
    const db = getDb();
    const [agency] = await db
      .select({ id: schema.agencies.id })
      .from(schema.agencies)
      .where(eq(schema.agencies.ownerId, uid))
      .limit(1);
    if (!agency) {
      return NextResponse.json({ error: "소속사 없음" }, { status: 404 });
    }

    const patch: Partial<typeof schema.agencies.$inferInsert> = {};
    if (b.companyName?.trim()) patch.companyName = b.companyName.trim();
    if (b.agencyType) {
      patch.agencyType = b.agencyType;
      patch.plan = planFor(b.agencyType);
    }
    if (b.manager !== undefined) patch.manager = b.manager || null;
    if (b.phone !== undefined) patch.phone = b.phone || null;
    if (b.email !== undefined) patch.email = b.email || null;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "변경 없음" }, { status: 400 });
    }
    await db
      .update(schema.agencies)
      .set(patch)
      .where(eq(schema.agencies.id, agency.id));
    if (patch.companyName) {
      await db
        .update(schema.users)
        .set({ company: patch.companyName })
        .where(eq(schema.users.id, uid));
    }
    revalidatePath("/agency/account");
    revalidatePath("/agency");
    return NextResponse.json({ ok: true, plan: patch.plan });
  } catch (e) {
    console.error("[agency profile]", e);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
