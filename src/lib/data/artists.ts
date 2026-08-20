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
    nameLocalized: (row.nameLocalized as Record<string, string> | null) ?? null,
    groupName: row.groupName ?? undefined,
    // 프로필 확장 필드 — null은 undefined로 정규화(화면에서 "값 없으면 행 숨김" 판정 단순화)
    bio: row.profile ?? undefined,
    birthYear: row.birthYear ?? undefined,
    careerStartYear: row.careerStartYear ?? undefined,
    activeRegions: row.activeRegions ?? undefined,
    heightCm: row.heightCm ?? undefined,
    weightKg: row.weightKg ?? undefined,
    skills: row.skills ?? undefined,
    credits: row.credits ?? undefined,
    videos: row.videos ?? undefined,
    links: row.links ?? undefined,
    languages: row.languages ?? undefined,
    acceptedEventTypes: row.acceptedEventTypes ?? undefined,
    minLeadDays: row.minLeadDays ?? undefined,
    fieldVisibility:
      (row.fieldVisibility as Artist["fieldVisibility"]) ?? undefined,
    profileExtras: row.profileExtras ?? undefined,
    agencyName: row.agencyName ?? "",
    category: categories[0] ?? "idol",
    categories,
    // null을 'group'으로 폴백하면 미입력 솔로 아티스트가 전부 그룹으로 취급돼
    // 공개 프로필 JSON-LD가 Person 대신 PerformingGroup으로 발행된다. 미입력은 미입력으로.
    gender: (row.gender as Artist["gender"]) ?? undefined,
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
    // 실 소속사(가입)면 빈 목록도 그대로 반환
    if (agencyId) return rows.map(rowToArtist);
  } catch {
    /* 폴백 */
  }
  // agencyId가 없으면 둘러보기(데모) — 실제 고객 아티스트를 보여주면
  // 남의 프로필·내부값이 데모 화면에 노출되므로 항상 샘플 데이터만 쓴다.
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
    return rows.map(rowToArtist);
  } catch {
    // 공개 경로는 목데이터로 폴백하지 않는다 — 샘플 프로필(실존 소속사명 포함)이
    // 검색·사이트맵에 노출되던 사고가 있었다. 데모(둘러보기)만 목을 쓴다.
    return [];
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
    /* 조회 실패 → 404 (목데이터로 되살리지 않는다) */
  }
  return null;
}

/**
 * 소속사 소유 아티스트 1명 — 편집기 전용(내부 운영값 포함).
 * 공개용 getPublicArtistBySlug를 편집기가 그대로 쓰면 남의 slug로 편집기를 열어
 * 견적 프리셋·분배율까지 볼 수 있다(저장만 IDOR로 막혀 있었음).
 */
export async function getOwnedArtistBySlug(
  agencyId: string,
  slug: string
): Promise<Artist | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select()
      .from(schema.artists)
      .where(
        and(eq(schema.artists.slug, slug), eq(schema.artists.agencyId, agencyId))
      )
      .limit(1);
    if (row) return rowToArtist(row);
  } catch {
    /* 조회 실패 → null */
  }
  return null;
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
    /* 조회 실패 → 404 (목데이터로 되살리지 않는다) */
  }
  return null;
}

/** 아티스트를 운영하는 유저 id — 연결된 크리에이터 계정 우선, 없으면 소속사 대표.
 *  신고·차단(App Store 1.2) 대상 식별용. 목데이터·조회 실패면 null(차단 항목 숨김). */
export async function getArtistOwnerUserId(
  artistId: string
): Promise<string | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select({
        userId: schema.artists.userId,
        ownerId: schema.agencies.ownerId,
      })
      .from(schema.artists)
      .leftJoin(schema.agencies, eq(schema.artists.agencyId, schema.agencies.id))
      .where(eq(schema.artists.id, artistId))
      .limit(1);
    return row?.userId ?? row?.ownerId ?? null;
  } catch {
    return null;
  }
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
