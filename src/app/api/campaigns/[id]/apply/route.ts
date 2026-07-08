import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyToCampaign } from "@/lib/data/campaigns";
import { getSessionAgency } from "@/lib/data/session";

const UUID = /^[0-9a-f-]{36}$/;

// 소속사 지원(역제안) — 아티스트 지정 + 어필 + (선택)제안 견적.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid || !UUID.test(uid))
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  try {
    const { id } = await params;
    const b = (await req.json()) as {
      artistId?: string;
      pitch?: string;
      proposedFee?: number;
      proposedIncludes?: string;
    };
    if (!b.artistId)
      return NextResponse.json(
        { error: "지원할 아티스트를 선택해주세요" },
        { status: 400 }
      );

    const agency = await getSessionAgency();
    const res = await applyToCampaign({
      campaignId: id,
      artistId: b.artistId,
      agencyId: agency?.id ?? null,
      applicantUserId: uid,
      pitch: b.pitch?.trim() || null,
      proposedFee: b.proposedFee ?? null,
      proposedIncludes: b.proposedIncludes?.trim() || null,
    });
    if (!res.ok)
      return NextResponse.json({ error: res.error }, { status: 400 });

    revalidatePath("/agency/campaigns");
    revalidatePath(`/requests/campaigns/${id}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[campaigns:apply]", e);
    return NextResponse.json({ error: "지원에 실패했어요" }, { status: 500 });
  }
}
