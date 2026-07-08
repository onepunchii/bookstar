/**
 * 정산 읽기 레이어 — Neon settlements를 UI의 Settlement 모양으로.
 * agencyRate = agency_rate_bp/10000. artistName은 artists 조인.
 */
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { SETTLEMENTS as MOCK } from "@/lib/mock-data";
import type { Settlement } from "@/lib/types";

const cols = {
  id: schema.settlements.id,
  artistId: schema.settlements.artistId,
  eventTitle: schema.settlements.eventTitle,
  eventDate: schema.settlements.eventDate,
  gross: schema.settlements.gross,
  agencyRateBp: schema.settlements.agencyRateBp,
  status: schema.settlements.status,
  taxInvoice: schema.settlements.taxInvoice,
  artistName: schema.artists.name,
};

type Row = {
  id: string;
  artistId: string;
  eventTitle: string;
  eventDate: string | null;
  gross: number;
  agencyRateBp: number;
  status: "paid" | "pending" | "overdue";
  taxInvoice: boolean;
  artistName: string | null;
};

function rowToSettlement(r: Row): Settlement {
  return {
    id: r.id,
    artistId: r.artistId,
    artistName: r.artistName ?? "",
    eventTitle: r.eventTitle,
    date: r.eventDate ?? "",
    gross: r.gross,
    agencyRate: r.agencyRateBp / 10000,
    status: r.status,
    taxInvoice: r.taxInvoice,
  };
}

export async function getSettlements(): Promise<Settlement[]> {
  try {
    const db = getDb();
    const rows = await db
      .select(cols)
      .from(schema.settlements)
      .leftJoin(schema.artists, eq(schema.settlements.artistId, schema.artists.id))
      .orderBy(desc(schema.settlements.createdAt));
    if (rows.length > 0) return (rows as Row[]).map(rowToSettlement);
  } catch {
    /* 폴백 */
  }
  return MOCK;
}
