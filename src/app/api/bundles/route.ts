import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { inArray, eq, and } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { createBundle } from "@/lib/data/bundles";
import { getSessionAgency } from "@/lib/data/session";

// 번들 생성 — 인증된 company 소속사만, 본인 아티스트 2팀+.
export async function POST(req: Request) {
  const agency = await getSessionAgency();
  if (!agency || agency.verificationStatus !== "verified")
    return NextResponse.json({ error: "소속사 인증이 필요해요" }, { status: 401 });
  if (agency.agencyType !== "company")
    return NextResponse.json(
      { error: "번들은 기업·MCN(소속사) 전용이에요. 계정·요금제에서 전환해주세요." },
      { status: 403 }
    );

  try {
    const b = (await req.json()) as {
      title?: string;
      subtitle?: string;
      artistIds?: string[];
      eventTypes?: string[];
      budgetMin?: number;
      budgetMax?: number;
      discountPct?: number;
    };
    if (!b.title?.trim())
      return NextResponse.json({ error: "세트 이름을 입력해주세요" }, { status: 400 });
    const ids = Array.isArray(b.artistIds) ? [...new Set(b.artistIds)] : [];
    if (ids.length < 2)
      return NextResponse.json(
        { error: "세트는 아티스트 2팀 이상으로 구성해주세요" },
        { status: 400 }
      );

    // 본인 소속 아티스트인지 검증
    const db = getDb();
    const owned = await db
      .select({ id: schema.artists.id })
      .from(schema.artists)
      .where(
        and(
          eq(schema.artists.agencyId, agency.id),
          inArray(schema.artists.id, ids)
        )
      );
    if (owned.length !== ids.length)
      return NextResponse.json(
        { error: "내 소속 아티스트만 묶을 수 있어요" },
        { status: 400 }
      );

    const id = await createBundle({
      agencyId: agency.id,
      title: b.title.trim(),
      subtitle: b.subtitle?.trim() || null,
      artistIds: ids,
      eventTypes: Array.isArray(b.eventTypes) ? b.eventTypes : [],
      budgetMin: b.budgetMin ?? null,
      budgetMax: b.budgetMax ?? null,
      discountPct: b.discountPct ?? null,
    });
    revalidatePath("/agency");
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error("[bundles:create]", e);
    return NextResponse.json({ error: "생성에 실패했어요" }, { status: 500 });
  }
}
