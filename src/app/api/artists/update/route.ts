import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import type { ArtistCategory } from "@/lib/types";

// 소속사 아티스트 프로필 저장 → artists UPDATE(slug 기준).
// 저장 즉시 공개 프로필(/@slug)·사이트맵에 반영되도록 캐시 무효화.
interface Payload {
  slug: string;
  name?: string;
  groupName?: string | null;
  tagline?: string;
  categories?: ArtistCategory[];
  tags?: string[];
  budgetMin?: number;
  budgetMax?: number;
  recentWork?: string[];
  presetFee?: number | null;
  presetIncludes?: string | null;
  presetNote?: string | null;
  defaultAgencyRateBp?: number;
  instagram?: string | null;
  youtube?: string | null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;
    if (!body.slug) {
      return NextResponse.json({ error: "slug 누락" }, { status: 400 });
    }

    // undefined 필드는 건드리지 않음 (부분 업데이트)
    const patch: Partial<typeof schema.artists.$inferInsert> = {};
    if (body.name !== undefined) patch.name = body.name;
    if (body.groupName !== undefined) patch.groupName = body.groupName;
    if (body.tagline !== undefined) patch.tagline = body.tagline;
    if (body.categories !== undefined) patch.categories = body.categories;
    if (body.tags !== undefined) patch.tags = body.tags;
    if (body.budgetMin !== undefined) patch.budgetMin = body.budgetMin;
    if (body.budgetMax !== undefined) patch.budgetMax = body.budgetMax;
    if (body.recentWork !== undefined) patch.recentWork = body.recentWork;
    if (body.presetFee !== undefined) patch.presetFee = body.presetFee;
    if (body.presetIncludes !== undefined)
      patch.presetIncludes = body.presetIncludes;
    if (body.presetNote !== undefined) patch.presetNote = body.presetNote;
    if (body.defaultAgencyRateBp !== undefined)
      patch.defaultAgencyRateBp = body.defaultAgencyRateBp;
    if (body.instagram !== undefined) patch.instagram = body.instagram;
    if (body.youtube !== undefined) patch.youtube = body.youtube;

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "변경 필드 없음" }, { status: 400 });
    }

    const db = getDb();
    const updated = await db
      .update(schema.artists)
      .set(patch)
      .where(eq(schema.artists.slug, body.slug))
      .returning({ slug: schema.artists.slug });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "해당 아티스트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 공개 노출 캐시 무효화
    revalidatePath(`/p/${body.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/agency/artists");

    return NextResponse.json({ ok: true, slug: body.slug });
  } catch (e) {
    console.error("[artist update]", e);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
