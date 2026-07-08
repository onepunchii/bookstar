// 서류함 읽기 레이어 — Neon documents → DocumentItem.
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { DOCUMENTS as MOCK } from "@/lib/mock-data";
import type { DocumentItem, DocType } from "@/lib/types";

export async function getDocuments(): Promise<DocumentItem[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: schema.documents.id,
        name: schema.documents.name,
        type: schema.documents.type,
        eventTitle: schema.documents.eventTitle,
        createdAt: schema.documents.createdAt,
        artistName: schema.artists.name,
      })
      .from(schema.documents)
      .leftJoin(schema.artists, eq(schema.documents.artistId, schema.artists.id))
      .orderBy(desc(schema.documents.createdAt));
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        type: r.type as DocType,
        eventTitle: r.eventTitle ?? "",
        artistName: r.artistName ?? "",
        date: r.createdAt.toISOString().slice(0, 10),
      }));
    }
  } catch {
    /* 폴백 */
  }
  return MOCK;
}
