import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getSessionAgency } from "@/lib/data/session";
import { artistLimit } from "@/lib/plan";

// 새 아티스트 등록 — 세션 소속사 스코프 + 유형별 한도. (소속사 인증 필요)
export async function POST() {
  const agency = await getSessionAgency();
  if (!agency) {
    return NextResponse.json(
      { error: "소속사 인증이 필요해요" },
      { status: 401 }
    );
  }
  try {
    const db = getDb();

    // 유형별 한도 확인 — solo는 1팀
    const [{ n }] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.artists)
      .where(eq(schema.artists.agencyId, agency.id));
    const limit = artistLimit(agency.agencyType);
    if (Number(n) >= limit) {
      return NextResponse.json(
        {
          error:
            "1인 기획사는 아티스트 1팀까지 등록할 수 있어요. 여러 팀을 관리하려면 계정·요금제에서 소속사(기업·MCN)로 전환해주세요.",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // 고유 슬러그
    const slug = `artist-${Date.now().toString(36)}${Math.floor(
      Math.random() * 1e4
    )
      .toString(36)
      .padStart(3, "0")}`;

    const [row] = await db
      .insert(schema.artists)
      .values({
        agencyId: agency.id,
        slug,
        agencyName: agency.companyName,
        name: "새 아티스트",
        categories: [],
        tags: [],
        recentWork: [],
        galleryUrls: [],
        status: "active",
      })
      .returning({ slug: schema.artists.slug });

    revalidatePath("/agency/artists");
    return NextResponse.json({ ok: true, slug: row.slug });
  } catch (e) {
    console.error("[artist create]", e);
    return NextResponse.json({ error: "등록 실패" }, { status: 500 });
  }
}
