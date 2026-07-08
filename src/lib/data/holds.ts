// 홀드 읽기 레이어 — Neon holds → Hold.
import { asc } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { Hold } from "@/lib/schedule-store";

function ymd(v: string | Date): string {
  return typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
}

export async function getHolds(): Promise<Hold[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.holds)
      .orderBy(asc(schema.holds.date));
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
