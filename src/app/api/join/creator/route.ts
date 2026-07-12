import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { sessionUserExists, STALE_SESSION_MSG } from "@/lib/data/session";
import type { ArtistCategory } from "@/lib/types";

// 크리에이터 셀프 가입 — 카카오 로그인 유저에게
// 1인 기획사(solo·무료) + 본인 아티스트 프로필을 생성한다.
interface Body {
  name: string;
  slug: string;
  category: ArtistCategory;
  gender: "male" | "female" | "group";
  instagram?: string;
  youtube?: string;
  baseFee?: number;
  includes?: string;
  tags?: string[];
  followers?: number;
}

export async function POST(req: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  // 유령 세션(삭제된 계정 토큰) 방어 — FK 위반 500 대신 재로그인 유도
  if (!(await sessionUserExists(uid)))
    return NextResponse.json({ error: STALE_SESSION_MSG }, { status: 401 });
  try {
    const b = (await req.json()) as Body;
    if (!b.name?.trim() || !b.slug?.trim()) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }
    const db = getDb();

    // 이미 본인 아티스트가 있으면 그대로
    const [existing] = await db
      .select({ slug: schema.artists.slug })
      .from(schema.artists)
      .where(eq(schema.artists.userId, uid))
      .limit(1);
    if (existing) {
      return NextResponse.json({ ok: true, slug: existing.slug, already: true });
    }

    // 소속사(1인 기획사) — 없으면 생성
    let [agency] = await db
      .select({ id: schema.agencies.id, companyName: schema.agencies.companyName })
      .from(schema.agencies)
      .where(eq(schema.agencies.ownerId, uid))
      .limit(1);
    if (!agency) {
      [agency] = await db
        .insert(schema.agencies)
        .values({
          ownerId: uid,
          companyName: b.name.trim(),
          agencyType: "solo",
          plan: "free",
        })
        .returning({
          id: schema.agencies.id,
          companyName: schema.agencies.companyName,
        });
    }

    // 슬러그 중복 시 접미사
    const base = b.slug.replace(/[^a-z0-9-]/g, "").toLowerCase() || "creator";
    let slug = base;
    for (let i = 0; i < 5; i++) {
      const [dup] = await db
        .select({ id: schema.artists.id })
        .from(schema.artists)
        .where(eq(schema.artists.slug, slug))
        .limit(1);
      if (!dup) break;
      slug = `${base}${Math.floor(Math.random() * 1000)}`;
    }

    await db.insert(schema.artists).values({
      agencyId: agency.id,
      userId: uid,
      slug,
      agencyName: agency.companyName,
      name: b.name.trim(),
      categories: [b.category],
      gender: b.gender,
      tagline: "",
      instagram: b.instagram || null,
      youtube: b.youtube || null,
      presetFee: b.baseFee || null,
      presetIncludes: b.includes || null,
      followers: b.followers ?? 0,
      tags: b.tags ?? [],
      recentWork: [],
      galleryUrls: [],
      status: "active",
    });

    await db
      .update(schema.users)
      .set({ role: "artist" })
      .where(eq(schema.users.id, uid));

    revalidatePath("/sitemap.xml");
    revalidatePath("/artists");
    return NextResponse.json({ ok: true, slug });
  } catch (e) {
    console.error("[join creator]", e);
    return NextResponse.json({ error: "가입 실패" }, { status: 500 });
  }
}
