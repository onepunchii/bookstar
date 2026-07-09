// 매니저 읽기 레이어 — Neon managers → Manager. 세션 소속사로 스코프.
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { MANAGERS as MOCK } from "@/lib/mock-data";
import type { Manager } from "@/lib/types";

const toManager = (r: typeof schema.managers.$inferSelect): Manager => ({
  id: r.id,
  name: r.name,
  role: r.role,
  phone: r.phone ?? "",
  artistIds: (r.artistIds as string[]) ?? [],
});

export async function getManagers(agencyId?: string): Promise<Manager[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.managers)
      .where(agencyId ? eq(schema.managers.agencyId, agencyId) : undefined)
      .orderBy(asc(schema.managers.createdAt));
    // 실 소속사(agencyId 지정) → 본인 매니저 그대로(비어 있으면 빈 배열, mock 폴백 없음)
    if (agencyId) return rows.map(toManager);
    // 데모(미지정): 있으면 그대로
    if (rows.length > 0) return rows.map(toManager);
  } catch {
    /* 폴백 */
  }
  // 데모 폴백 — 예시 1개만, demo 마킹
  return MOCK.slice(0, 1).map((m) => ({ ...m, demo: true }));
}
