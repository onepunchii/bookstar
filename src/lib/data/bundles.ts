// 번들 상품(아티스트 세트) 데이터 레이어. company(기업·MCN) 전용.
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface BundleArtist {
  id: string;
  name: string;
  slug: string | null;
  imageUrl: string | null;
}
export interface AgencyBundle {
  id: string;
  title: string;
  subtitle: string | null;
  eventTypes: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  discountPct: number | null;
  artists: BundleArtist[];
  createdAt: string;
}

export interface BundleInput {
  agencyId: string;
  title: string;
  subtitle?: string | null;
  artistIds: string[];
  eventTypes?: string[];
  budgetMin?: number | null;
  budgetMax?: number | null;
  discountPct?: number | null;
}

export async function getAgencyBundles(
  agencyId: string
): Promise<AgencyBundle[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.bundles)
    .where(eq(schema.bundles.agencyId, agencyId))
    .orderBy(desc(schema.bundles.createdAt));
  if (rows.length === 0) return [];

  // 구성 아티스트 일괄 조회
  const ids = [...new Set(rows.flatMap((b) => (b.artistIds as string[]) ?? []))];
  const arts = ids.length
    ? await db
        .select({
          id: schema.artists.id,
          name: schema.artists.name,
          slug: schema.artists.slug,
          imageUrl: schema.artists.imageUrl,
        })
        .from(schema.artists)
        .where(inArray(schema.artists.id, ids))
    : [];
  const byId = new Map(arts.map((a) => [a.id, a]));

  return rows.map((b) => ({
    id: b.id,
    title: b.title,
    subtitle: b.subtitle,
    eventTypes: (b.eventTypes as string[]) ?? [],
    budgetMin: b.budgetMin,
    budgetMax: b.budgetMax,
    discountPct: b.discountPct,
    artists: ((b.artistIds as string[]) ?? [])
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((a) => ({
        id: a!.id,
        name: a!.name,
        slug: a!.slug,
        imageUrl: a!.imageUrl,
      })),
    createdAt: b.createdAt.toISOString(),
  }));
}

export async function createBundle(input: BundleInput): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(schema.bundles)
    .values({
      agencyId: input.agencyId,
      title: input.title,
      subtitle: input.subtitle ?? null,
      artistIds: input.artistIds,
      eventTypes: input.eventTypes ?? [],
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      discountPct: input.discountPct ?? null,
    })
    .returning({ id: schema.bundles.id });
  return row.id;
}

export async function deleteBundle(id: string, agencyId: string) {
  const db = getDb();
  await db
    .delete(schema.bundles)
    .where(and(eq(schema.bundles.id, id), eq(schema.bundles.agencyId, agencyId)));
}
