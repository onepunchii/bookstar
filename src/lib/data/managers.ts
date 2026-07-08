// 매니저 읽기 레이어 — Neon managers → Manager.
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { MANAGERS as MOCK } from "@/lib/mock-data";
import type { Manager } from "@/lib/types";

export async function getManagers(): Promise<Manager[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.managers)
      .orderBy(asc(schema.managers.createdAt));
    if (rows.length > 0) {
      return rows.map((r) => ({
        id: r.id,
        name: r.name,
        role: r.role,
        phone: r.phone ?? "",
        artistIds: (r.artistIds as string[]) ?? [],
      }));
    }
  } catch {
    /* 폴백 */
  }
  return MOCK;
}
