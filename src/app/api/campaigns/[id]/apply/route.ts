import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { applyToCampaign } from "@/lib/data/campaigns";
import {
  getSessionAgency,
  sessionUserExists,
  STALE_SESSION_MSG,
} from "@/lib/data/session";
import { agencyOwnsArtist } from "@/lib/data/ownership";

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
  if (!(await sessionUserExists(uid)))
    return NextResponse.json({ error: STALE_SESSION_MSG }, { status: 401 });

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
    // 본인 소속사 소유 아티스트로만 지원 가능(남의 아티스트로 위장·그리핑 방지)
    if (!agency || !(await agencyOwnsArtist(agency.id, b.artistId)))
      return NextResponse.json(
        { error: "본인 소속사의 아티스트만 지원할 수 있어요" },
        { status: 403 }
      );
    const res = await applyToCampaign({
      campaignId: id,
      artistId: b.artistId,
      agencyId: agency.id,
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
