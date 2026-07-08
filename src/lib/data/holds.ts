// 홀드 읽기 레이어 — Neon holds → Hold.
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { Hold } from "@/lib/schedule-store";

function ymd(v: string | Date): string {
  return typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
}

/** agencyId 주면 그 소속사 아티스트의 홀드만 */
export async function getHolds(agencyId?: string): Promise<Hold[]> {
  try {
    const db = getDb();
    const q = db
      .select({
        artistId: schema.holds.artistId,
        date: schema.holds.date,
        requestId: schema.holds.requestId,
        companyName: schema.holds.companyName,
        expiresAt: schema.holds.expiresAt,
      })
      .from(schema.holds)
      .leftJoin(schema.artists, eq(schema.holds.artistId, schema.artists.id));
    const rows = await (agencyId
      ? q.where(eq(schema.artists.agencyId, agencyId))
      : q
    ).orderBy(asc(schema.holds.date));
    return rows.map((r) => ({
      artistId: r.artistId,
      date: ymd(r.date),
      requestId: r.requestId ?? undefined,
      companyName: r.companyName ?? undefined,
      expiresAt: ymd(r.expiresAt),
    }));
  } catch {
    return [];
  }
}
