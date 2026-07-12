// 멀티테넌트 소유권 검증 — 쓰기 API의 IDOR/BOLA 방어 공용 헬퍼.
// 소유권 앵커: 대상 레코드 → artistId → artists.agencyId → agencies.ownerId(세션 uid).
// 세션 소속사(getSessionAgency)가 대상 아티스트를 소유할 때만 쓰기를 허용한다.
import { and, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

/** artistId가 이 소속사 소유인가 */
export async function agencyOwnsArtist(
  agencyId: string,
  artistId: string
): Promise<boolean> {
  if (!agencyId || !artistId) return false;
  try {
    const db = getDb();
    const [a] = await db
      .select({ id: schema.artists.id })
      .from(schema.artists)
      .where(
        and(
          eq(schema.artists.id, artistId),
          eq(schema.artists.agencyId, agencyId)
        )
      )
      .limit(1);
    return !!a;
  } catch {
    return false;
  }
}

/** 이 아티스트들이 모두 해당 소속사 소유인가(부분집합) */
export async function agencyOwnsAllArtists(
  agencyId: string,
  artistIds: string[]
): Promise<boolean> {
  const ids = [...new Set(artistIds.filter(Boolean))];
  if (ids.length === 0) return true;
  if (!agencyId) return false;
  try {
    const db = getDb();
    const rows = await db
      .select({ id: schema.artists.id })
      .from(schema.artists)
      .where(
        and(
          eq(schema.artists.agencyId, agencyId),
          inArray(schema.artists.id, ids)
        )
      );
    return rows.length === ids.length;
  } catch {
    return false;
  }
}

/** slug가 이 소속사 소유면 artistId 반환, 아니면 null */
export async function agencyArtistIdBySlug(
  agencyId: string,
  slug: string
): Promise<string | null> {
  if (!agencyId || !slug) return null;
  try {
    const db = getDb();
    const [a] = await db
      .select({ id: schema.artists.id })
      .from(schema.artists)
      .where(
        and(eq(schema.artists.slug, slug), eq(schema.artists.agencyId, agencyId))
      )
      .limit(1);
    return a?.id ?? null;
  } catch {
    return null;
  }
}

/** 자식 레코드(예: 정산·데일리시트·매니저)의 artistId/agencyId를 읽어 세션 소속사 소유인지 확인.
 *  artistId 컬럼을 가진 테이블용. 반환: 소유하면 true. */
export async function agencyOwnsRecordArtist(
  agencyId: string,
  artistId: string | null | undefined
): Promise<boolean> {
  if (!artistId) return false;
  return agencyOwnsArtist(agencyId, artistId);
}
