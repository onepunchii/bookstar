import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getSessionAgency } from "@/lib/data/session";
import { agencyArtistIdBySlug } from "@/lib/data/ownership";
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
  nameLocalized?: Record<string, string> | null;
}

// 지원 로케일 키만, 문자열·트림·길이제한. 유효값 없으면 null(=초기화).
const NAME_LOCALES = ["en", "ja", "zh-TW", "th"] as const;
function sanitizeNameLocalized(
  input: Record<string, string> | null | undefined
): Record<string, string> | null {
  if (!input || typeof input !== "object") return null;
  const out: Record<string, string> = {};
  for (const loc of NAME_LOCALES) {
    const v = input[loc];
    if (typeof v === "string" && v.trim()) out[loc] = v.trim().slice(0, 80);
  }
  return Object.keys(out).length ? out : null;
}

export async function POST(req: Request) {
  try {
    const agency = await getSessionAgency();
    if (!agency) {
      return NextResponse.json({ error: "소속사 인증이 필요합니다" }, { status: 401 });
    }

    const body = (await req.json()) as Payload;
    if (!body.slug) {
      return NextResponse.json({ error: "slug 누락" }, { status: 400 });
    }
    // 이 slug가 세션 소속사 소유인지 확인 (IDOR 방어)
    if (!(await agencyArtistIdBySlug(agency.id, body.slug)))
      return NextResponse.json(
        { error: "해당 아티스트를 찾을 수 없습니다" },
        { status: 404 }
      );

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
    if (body.nameLocalized !== undefined)
      patch.nameLocalized = sanitizeNameLocalized(body.nameLocalized);

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
