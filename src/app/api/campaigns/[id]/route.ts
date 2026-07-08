import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { closeCampaign, extendDeadline } from "@/lib/data/campaigns";

const UUID = /^[0-9a-f-]{36}$/;

// 광고주: 캠페인 마감 / 기한 연장.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid || !UUID.test(uid))
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  try {
    const { id } = await params;
    const b = (await req.json()) as { action?: string; deadline?: string };
    if (b.action === "close") {
      await closeCampaign(id, uid);
    } else if (b.action === "extend" && b.deadline) {
      await extendDeadline(id, uid, b.deadline);
    } else {
      return NextResponse.json({ error: "알 수 없는 요청" }, { status: 400 });
    }
    revalidatePath(`/requests/campaigns/${id}`);
    revalidatePath("/requests/campaigns");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[campaigns:patch]", e);
    return NextResponse.json({ error: "처리에 실패했어요" }, { status: 500 });
  }
}
