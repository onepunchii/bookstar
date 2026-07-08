/**
 * 공개 아티스트 읽기 레이어 — Neon(Drizzle)에서 읽어 UI가 쓰는 `Artist` 모양으로 변환.
 *
 * 소속사가 아티스트를 등록하면(= artists 행 추가) 이 레이어를 읽는 사이트맵·
 * 공개 프로필·브라우즈가 자동으로 반영한다. DATABASE_URL이 없거나 쿼리가
 * 실패하면 목데이터로 폴백해 로컬/빌드가 깨지지 않게 한다.
 */
import { and, asc, eq, ne } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import {
  ARTISTS as MOCK_ARTISTS,
  SCHEDULES as MOCK_SCHEDULES,
} from "@/lib/mock-data";
import type { Artist, ArtistCategory, ScheduleDay } from "@/lib/types";

type ArtistRow = typeof schema.artists.$inferSelect;

function rowToArtist(row: ArtistRow): Artist {
  const categories = (row.categories as ArtistCategory[]) ?? [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    groupName: row.groupName ?? undefined,
    agencyName: row.agencyName ?? "",
    category: categories[0] ?? "idol",
    categories,
    gender: (row.gender as Artist["gender"]) ?? "group",
    tagline: row.tagline ?? "",
    imageUrl: row.imageUrl ?? undefined,
    galleryUrls: (row.galleryUrls as string[]) ?? [],
    followers: row.followers,
    responseRate: row.responseRate,
    responseHours: row.responseHours,
    budgetRange: [row.budgetMin ?? 0, row.budgetMax ?? 0],
    tags: (row.tags as string[]) ?? [],
    verified: row.verified,
    recentWork: (row.recentWork as string[]) ?? [],
    quotePreset: row.presetFee
      ? {
          baseFee: row.presetFee,
          includes: row.presetIncludes ?? "",
          note: row.presetNote ?? undefined,
        }
      : undefined,
    defaultAgencyRate: row.defaultAgencyRateBp / 10000,
    instagram: row.instagram ?? undefined,
    youtube: row.youtube ?? undefined,
  };
}

/**
 * 소속사 콘솔용 아티스트.
 * agencyId 주면 그 소속사 것만(=가입한 실 소속사), 없으면 전체(=데모/테스터).
 */
export async function getAgencyArtists(agencyId?: string): Promise<Artist[]> {
  try {
    const db = getDb();
    const rows = agencyId
      ? await db
          .select()
          .from(schema.artists)
          .where(eq(schema.artists.agencyId, agencyId))
          .orderBy(asc(schema.artists.createdAt))
      : await db
          .select()
          .from(schema.artists)
          .orderBy(asc(schema.artists.createdAt));
    // 실 소속사(가입)면 빈 목록도 그대로 반환, 데모면 폴백 허용
    if (agencyId) return rows.map(rowToArtist);
    if (rows.length > 0) return rows.map(rowToArtist);
  } catch {
    /* 폴백 */
  }
  return agencyId ? [] : MOCK_ARTISTS;
}

/** 공개 아티스트 전체 — 브라우즈·사이트맵용 */
export async function getPublicArtists(): Promise<Artist[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.artists)
      .where(
        and(
          eq(schema.artists.status, "active"),
          // 이름 미설정(기본값) 빈 프로필은 공개 노출 제외
          ne(schema.artists.name, "새 아티스트")
        )
      )
      .orderBy(asc(schema.artists.createdAt));
    if (rows.length === 0) return MOCK_ARTISTS;
    return rows.map(rowToArtist);
  } catch {
    return MOCK_ARTISTS;
  }
}

/** uuid로 공개 아티스트 1명 (공유 링크 OG 등) */
export async function getPublicArtistById(id: string): Promise<Artist | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(schema.artists)
      .where(eq(schema.artists.id, id))
      .limit(1);
    if (row) return rowToArtist(row);
  } catch {
    /* 폴백 */
  }
  return MOCK_ARTISTS.find((a) => a.id === id) ?? null;
}

/** 슬러그로 공개 아티스트 1명 */
export async function getPublicArtistBySlug(
  slug: string
): Promise<Artist | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(schema.artists)
      .where(eq(schema.artists.slug, slug))
      .limit(1);
    if (row) return rowToArtist(row);
  } catch {
    /* 폴백 */
  }
  return MOCK_ARTISTS.find((a) => a.slug === slug) ?? null;
}

/** 특정 아티스트의 공개 가능 일정 (availability 캘린더용) */
export async function getPublicSchedule(
  artistId: string
): Promise<ScheduleDay[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.schedules)
      .where(eq(schema.schedules.artistId, artistId))
      .orderBy(asc(schema.schedules.date));
    return rows.map((r) => ({
      date: r.date,
      availability: r.availability,
      note: r.publicNote ?? undefined,
    }));
  } catch {
    // 폴백: 목 일정은 mock id 키 → uuid로는 못 찾으니 빈 배열
    return MOCK_SCHEDULES[artistId] ?? [];
  }
}

/** 아티스트별 일정 맵 — 브라우즈 필터(자연어 날짜 범위)용 */
export async function getPublicScheduleMap(): Promise<
  Record<string, ScheduleDay[]>
> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.schedules)
      .orderBy(asc(schema.schedules.date));
    const map: Record<string, ScheduleDay[]> = {};
    for (const r of rows) {
      (map[r.artistId] ??= []).push({
        date: r.date,
        availability: r.availability,
        note: r.publicNote ?? undefined,
      });
    }
    if (Object.keys(map).length > 0) return map;
  } catch {
    /* 폴백 */
  }
  return MOCK_SCHEDULES;
}
