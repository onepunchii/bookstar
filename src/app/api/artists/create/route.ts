import { desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";

// 새 아티스트 등록 — 빈 프로필 생성 후 편집 화면으로. (소속사 인증 필요)
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  try {
    const db = getDb();
    // 소속 소속사(데모: 첫 소속사)
    const [agency] = await db
      .select({ id: schema.agencies.id, companyName: schema.agencies.companyName })
      .from(schema.agencies)
      .limit(1);
    if (!agency) {
      return NextResponse.json({ error: "소속사 없음" }, { status: 400 });
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
