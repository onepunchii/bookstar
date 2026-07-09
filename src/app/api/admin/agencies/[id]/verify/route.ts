import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/data/admin";
import { notify } from "@/lib/data/notify";

// 관리자: 소속사 인증 승인/반려.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  try {
    const { id } = await params;
    const { action } = (await req.json()) as { action?: string };
    if (action !== "approve" && action !== "reject")
      return NextResponse.json({ error: "알 수 없는 요청" }, { status: 400 });

    const db = getDb();
    const approved = action === "approve";
    const [row] = await db
      .update(schema.agencies)
      .set({
        verified: approved,
        verificationStatus: approved ? "verified" : "rejected",
      })
      .where(eq(schema.agencies.id, id))
      .returning({
        ownerId: schema.agencies.ownerId,
        companyName: schema.agencies.companyName,
      });

    if (row?.ownerId) {
      await notify(row.ownerId, {
        type: approved ? "agency_verified" : "agency_rejected",
        title: approved
          ? "소속사 인증이 승인됐어요 🎉"
          : "소속사 인증이 반려됐어요",
        body: approved
          ? `${row.companyName} · 이제 공개 프로필·정산이 열립니다`
          : `${row.companyName} · 서류를 다시 확인해 재제출해 주세요`,
        link: approved ? "/agency" : "/agency/verify",
      });
    }

    revalidatePath("/admin/agencies");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin agency verify]", e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
