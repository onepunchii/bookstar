import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { sessionUserExists, STALE_SESSION_MSG } from "@/lib/data/session";

// 소속사 셀프 가입 — 로그인 유저 소유 소속사 생성(심사 대기) + 역할 부여.
// 서류(사업자등록증 등) 첨부 시 관리자 승인 → verification_status=verified.
export async function POST(req: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  if (!(await sessionUserExists(uid)))
    return NextResponse.json({ error: STALE_SESSION_MSG }, { status: 401 });
  try {
    const body = (await req.json().catch(() => ({}))) as {
      companyName?: string;
      manager?: string;
      phone?: string;
      agencyType?: string;
      businessDocUrl?: string;
      businessNumber?: string;
      businessType?: string;
    };
    const db = getDb();

    // 이미 소속사가 있으면 서류·정보만 갱신(재제출)
    const [existing] = await db
      .select({
        id: schema.agencies.id,
        verificationStatus: schema.agencies.verificationStatus,
      })
      .from(schema.agencies)
      .where(eq(schema.agencies.ownerId, uid))
      .limit(1);
    if (existing) {
      const patch: Partial<typeof schema.agencies.$inferInsert> = {};
      if (body.companyName?.trim()) patch.companyName = body.companyName.trim();
      if (body.manager?.trim()) patch.manager = body.manager.trim();
      if (body.phone?.trim()) patch.phone = body.phone.trim();
      if (body.businessNumber?.trim())
        patch.businessNumber = body.businessNumber.trim();
      if (body.businessType?.trim())
        patch.businessType = body.businessType.trim();
      if (body.businessDocUrl) {
        patch.businessDocUrl = body.businessDocUrl;
        // 서류 재제출 → 심사 대기(반려됐던 경우 재심사)
        if (existing.verificationStatus !== "verified")
          patch.verificationStatus = "pending";
      }
      if (Object.keys(patch).length > 0)
        await db
          .update(schema.agencies)
          .set(patch)
          .where(eq(schema.agencies.id, existing.id));
      revalidatePath("/agency");
      return NextResponse.json({
        ok: true,
        id: existing.id,
        already: true,
        status: patch.verificationStatus ?? existing.verificationStatus,
      });
    }

    const companyName =
      body.companyName?.trim() || `${session.user?.name ?? "내"} 엔터테인먼트`;
    const [agency] = await db
      .insert(schema.agencies)
      .values({
        ownerId: uid,
        companyName,
        manager: body.manager?.trim() || null,
        phone: body.phone?.trim() || null,
        agencyType: body.agencyType === "company" ? "company" : "solo",
        businessDocUrl: body.businessDocUrl ?? null,
        businessNumber: body.businessNumber?.trim() || null,
        businessType: body.businessType?.trim() || null,
        verified: false,
        verificationStatus: "pending",
      })
      .returning({ id: schema.agencies.id });
    await db
      .update(schema.users)
      .set({ role: "agency", company: companyName })
      .where(eq(schema.users.id, uid));
    revalidatePath("/agency");
    revalidatePath("/agency/artists");
    return NextResponse.json({ ok: true, id: agency.id, status: "pending" });
  } catch (e) {
    console.error("[join agency]", e);
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }
}
