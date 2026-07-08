import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { selectApplication } from "@/lib/data/campaigns";

const UUID = /^[0-9a-f-]{36}$/;

// 광고주 지원자 선정 → booking_requests로 전환.
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
    const b = (await req.json()) as { applicationId?: string };
    if (!b.applicationId)
      return NextResponse.json({ error: "지원을 선택해주세요" }, { status: 400 });

    const res = await selectApplication(id, b.applicationId, uid);
    if (!res.ok)
      return NextResponse.json({ error: res.error }, { status: 400 });

    revalidatePath(`/requests/campaigns/${id}`);
    revalidatePath("/requests");
    return NextResponse.json({ ok: true, requestId: res.requestId });
  } catch (e) {
    console.error("[campaigns:select]", e);
    return NextResponse.json({ error: "선정에 실패했어요" }, { status: 500 });
  }
}
