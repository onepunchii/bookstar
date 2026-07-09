import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { notify } from "@/lib/data/notify";
import { sessionUserExists, STALE_SESSION_MSG } from "@/lib/data/session";

// 소속사 셀프 가입 — 서류(OCR 확인) 첨부 시 즉시 자동 인증 + 역할 부여.
// 관리자는 사후 검수(대행사 의심 플래그·반려 권한). 반려된 곳의 재제출만 수동 심사(pending).
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

    // 관리자 사후 검수용 알림
    const notifyAdmins = async (companyName: string, auto: boolean) => {
      try {
        const admins = await db
          .select({ id: schema.users.id })
          .from(schema.users)
          .where(eq(schema.users.role, "admin"));
        for (const a of admins) {
          await notify(a.id, {
            type: "agency_signup",
            title: auto ? "새 소속사 자동 인증" : "소속사 재제출 심사 대기",
            body: companyName,
            link: "/admin/agencies",
          });
        }
      } catch {
        /* 알림 실패해도 가입은 유지 */
      }
    };

    // 이미 소속사가 있으면 서류·정보만 갱신(재제출)
    const [existing] = await db
      .select({
        id: schema.agencies.id,
        companyName: schema.agencies.companyName,
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
        if (existing.verificationStatus === "rejected") {
          // 반려됐던 곳의 재제출 → 수동 재심사
          patch.verificationStatus = "pending";
        } else if (existing.verificationStatus !== "verified") {
          // 그 외(미완료)는 서류 첨부 즉시 자동 인증
          patch.verificationStatus = "verified";
          patch.verified = true;
        }
      }
      if (Object.keys(patch).length > 0)
        await db
          .update(schema.agencies)
          .set(patch)
          .where(eq(schema.agencies.id, existing.id));
      const finalStatus =
        patch.verificationStatus ?? existing.verificationStatus;
      if (patch.verificationStatus)
        await notifyAdmins(
          patch.companyName ?? existing.companyName,
          finalStatus === "verified"
        );
      revalidatePath("/agency");
      return NextResponse.json({
        ok: true,
        id: existing.id,
        already: true,
        status: finalStatus,
      });
    }

    const companyName =
      body.companyName?.trim() || `${session.user?.name ?? "내"} 엔터테인먼트`;
    // 서류 첨부 시 즉시 자동 인증 (지금은 전면 무료 — 관리자 사후 검수)
    const autoVerified = !!body.businessDocUrl;
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
        verified: autoVerified,
        verificationStatus: autoVerified ? "verified" : "pending",
      })
      .returning({ id: schema.agencies.id });
    await db
      .update(schema.users)
      .set({ role: "agency", company: companyName })
      .where(eq(schema.users.id, uid));
    await notifyAdmins(companyName, autoVerified);
    revalidatePath("/agency");
    revalidatePath("/agency/artists");
    return NextResponse.json({
      ok: true,
      id: agency.id,
      status: autoVerified ? "verified" : "pending",
    });
  } catch (e) {
    console.error("[join agency]", e);
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }
}
