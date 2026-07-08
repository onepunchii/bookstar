/**
 * 데일리 시트 읽기 레이어 — Neon day_schedules를 UI의 DaySchedule 모양으로.
 * artistName은 artists 조인으로 파생(비저장). DB 불가 시 mock 폴백.
 */
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { DAY_SCHEDULES as MOCK_DAY } from "@/lib/mock-data";
import type { DaySchedule, DayStop } from "@/lib/types";

const cols = {
  id: schema.daySchedules.id,
  artistId: schema.daySchedules.artistId,
  date: schema.daySchedules.date,
  title: schema.daySchedules.title,
  eventType: schema.daySchedules.eventType,
  manager: schema.daySchedules.manager,
  vehicle: schema.daySchedules.vehicle,
  stops: schema.daySchedules.stops,
  memo: schema.daySchedules.memo,
  artistName: schema.artists.name,
};

type Row = {
  id: string;
  artistId: string;
  date: string;
  title: string;
  eventType: string | null;
  manager: string | null;
  vehicle: string | null;
  stops: DayStop[];
  memo: string | null;
  artistName: string | null;
};

function rowToDay(r: Row): DaySchedule {
  return {
    id: r.id,
    artistId: r.artistId,
    artistName: r.artistName ?? "미배정",
    date: r.date,
    title: r.title,
    eventType: r.eventType ?? "행사",
    manager: r.manager ?? "미배정",
    vehicle: r.vehicle ?? undefined,
    stops: (r.stops as DayStop[]) ?? [],
    memo: r.memo ?? undefined,
  };
}

export async function getDaySchedules(): Promise<DaySchedule[]> {
  try {
    const db = getDb();
    const rows = await db
      .select(cols)
      .from(schema.daySchedules)
      .leftJoin(schema.artists, eq(schema.daySchedules.artistId, schema.artists.id))
      .orderBy(asc(schema.daySchedules.date));
    if (rows.length > 0) return (rows as Row[]).map(rowToDay);
  } catch {
    /* 폴백 */
  }
  return MOCK_DAY;
}

export async function getDayScheduleById(
  id: string
): Promise<DaySchedule | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select(cols)
      .from(schema.daySchedules)
      .leftJoin(schema.artists, eq(schema.daySchedules.artistId, schema.artists.id))
      .where(eq(schema.daySchedules.id, id))
      .limit(1);
    if (row) return rowToDay(row as Row);
  } catch {
    /* 폴백 */
  }
  return MOCK_DAY.find((d) => d.id === id) ?? null;
}

// 특정 아티스트의 데일리 시트 (캘린더 피드용)
export async function getDaySchedulesByArtist(
  artistId: string
): Promise<DaySchedule[]> {
  try {
    const db = getDb();
    const rows = await db
      .select(cols)
      .from(schema.daySchedules)
      .leftJoin(schema.artists, eq(schema.daySchedules.artistId, schema.artists.id))
      .where(eq(schema.daySchedules.artistId, artistId))
      .orderBy(asc(schema.daySchedules.date));
    return (rows as Row[]).map(rowToDay);
  } catch {
    return MOCK_DAY.filter((d) => d.artistId === artistId);
  }
}
