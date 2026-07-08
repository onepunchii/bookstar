// 휴가 읽기 레이어 — Neon leaves → LeaveRequest.
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { LeaveRequest } from "@/lib/types";

function ymd(v: string | Date): string {
  return typeof v === "string" ? v.slice(0, 10) : v.toISOString().slice(0, 10);
}

export async function getLeaves(): Promise<LeaveRequest[]> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: schema.leaves.id,
        artistId: schema.leaves.artistId,
        startDate: schema.leaves.startDate,
        endDate: schema.leaves.endDate,
        reason: schema.leaves.reason,
        status: schema.leaves.status,
        artistName: schema.artists.name,
      })
      .from(schema.leaves)
      .leftJoin(schema.artists, eq(schema.leaves.artistId, schema.artists.id))
      .orderBy(desc(schema.leaves.createdAt));
    return rows.map((r) => ({
      id: r.id,
      artistId: r.artistId,
      artistName: r.artistName ?? "",
      startDate: ymd(r.startDate),
      endDate: ymd(r.endDate),
      reason: r.reason ?? "",
      status: r.status,
    }));
  } catch {
    return [];
  }
}
