// 서류함 읽기 레이어 — Neon documents → DocumentItem. 세션 소속사로 스코프.
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { DOCUMENTS as MOCK } from "@/lib/mock-data";
import type { DocumentItem, DocType } from "@/lib/types";

export async function getDocuments(agencyId?: string): Promise<DocumentItem[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: schema.documents.id,
        name: schema.documents.name,
        type: schema.documents.type,
        eventTitle: schema.documents.eventTitle,
        fileUrl: schema.documents.fileUrl,
        createdAt: schema.documents.createdAt,
        artistName: schema.artists.name,
      })
      .from(schema.documents)
      .leftJoin(schema.artists, eq(schema.documents.artistId, schema.artists.id))
      .where(agencyId ? eq(schema.documents.agencyId, agencyId) : undefined)
      .orderBy(desc(schema.documents.createdAt));
    const items = rows.map((r) => ({
      id: r.id,
      name: r.name,
      type: r.type as DocType,
      eventTitle: r.eventTitle ?? "",
      artistName: r.artistName ?? "",
      date: r.createdAt.toISOString().slice(0, 10),
      fileUrl: r.fileUrl ?? undefined,
    }));
    // 실 소속사(agencyId 지정) → 본인 서류 그대로(비어 있으면 빈 배열, mock 없음)
    if (agencyId) return items;
    if (items.length > 0) return items;
  } catch {
    /* 폴백 */
  }
  // 데모 폴백 — 예시 1개만, demo 마킹
  return MOCK.slice(0, 1).map((d) => ({ ...d, demo: true }));
}
