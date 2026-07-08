import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createCampaign } from "@/lib/data/campaigns";

const UUID = /^[0-9a-f-]{36}$/;

// 광고주 오픈 캠페인 생성 — 로그인 필수.
export async function POST(req: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid || !UUID.test(uid))
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  try {
    const b = (await req.json()) as {
      title?: string;
      eventType?: string;
      categories?: string[];
      budgetMin?: number;
      budgetMax?: number;
      location?: string;
      eventDate?: string;
      deadline?: string;
      description?: string;
      imageUrl?: string;
      companyName?: string;
    };
    if (!b.title?.trim() || !b.eventType?.trim() || !b.deadline)
      return NextResponse.json(
        { error: "제목·유형·마감일은 필수예요" },
        { status: 400 }
      );

    const companyName =
      b.companyName?.trim() || session.user?.name || null;

    const id = await createCampaign({
      companyUserId: uid,
      companyName,
      title: b.title.trim(),
      eventType: b.eventType.trim(),
      categories: Array.isArray(b.categories) ? b.categories : [],
      budgetMin: b.budgetMin ?? null,
      budgetMax: b.budgetMax ?? null,
      location: b.location?.trim() || null,
      eventDate: b.eventDate || null,
      deadline: b.deadline,
      description: b.description?.trim() || null,
      imageUrl: b.imageUrl || null,
    });

    revalidatePath("/requests/campaigns");
    revalidatePath("/agency/campaigns");
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[campaigns:create]", e);
    // 임시 진단: 실제 원인을 화면에 노출 (원인 확인 후 일반 메시지로 복구)
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `생성 실패: ${msg}` },
      { status: 500 }
    );
  }
}
