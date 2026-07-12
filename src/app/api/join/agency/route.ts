import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { notify } from "@/lib/data/notify";
import { sessionUserExists, STALE_SESSION_MSG } from "@/lib/data/session";

// 업로드된 서류가 이 유저 소유의 실제 Blob인지 검증 — 임의 문자열로 인증 우회 방지.
// (서류는 /api/join/agency/doc가 agency-docs/{uid}/ 에 저장한다)
function isOwnBusinessDoc(url: string | undefined, uid: string): boolean {
  if (!url) return false;
  try {
    const u = new URL(url);
    return (
      u.protocol === "https:" &&
      u.hostname.endsWith(".blob.vercel-storage.com") &&
      u.pathname.includes(`/agency-docs/${uid}/`)
    );
  } catch {
    return false;
  }
}

// 소속사 셀프 가입 — 서류(OCR 확인) 첨부 시 즉시 자동 인증 + 역할 부여.
// 관리자는 사후 검수(대행사 의심 플래그·반려 권한). 재제출은 자동 승격 금지(수동 심사).
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
      if (isOwnBusinessDoc(body.businessDocUrl, uid)) {
        patch.businessDocUrl = body.businessDocUrl;
        // 재제출은 자동 승격하지 않는다(반려 우회 방지). 이미 verified면 유지,
        // 그 외(반려·미완료)는 pending으로 두고 관리자 재심사.
        if (existing.verificationStatus !== "verified") {
          patch.verificationStatus = "pending";
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
    const agencyType = body.agencyType === "company" ? "company" : "solo";
    // 1인·인플루언서(solo)는 서류 없이 즉시 인증.
    // 기업·MCN(company)은 본인 소유의 실제 서류(agency-docs/{uid})가 확인될 때만 자동 인증.
    const hasValidDoc = isOwnBusinessDoc(body.businessDocUrl, uid);
    const autoVerified = agencyType === "solo" || hasValidDoc;
    const [agency] = await db
      .insert(schema.agencies)
      .values({
        ownerId: uid,
        companyName,
        manager: body.manager?.trim() || null,
        phone: body.phone?.trim() || null,
        agencyType,
        businessDocUrl: hasValidDoc ? body.businessDocUrl : null,
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
