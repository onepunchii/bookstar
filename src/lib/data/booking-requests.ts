/**
 * 섭외 요청(인박스) 읽기 레이어 — Neon booking_requests를 UI의 BookingRequest 모양으로.
 * artistName은 artists 조인. company 정보는 비정규화 컬럼.
 */
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { BOOKING_REQUESTS as MOCK } from "@/lib/mock-data";
import type { BookingRequest, BookingStatus, EventType } from "@/lib/types";

const cols = {
  id: schema.bookingRequests.id,
  artistId: schema.bookingRequests.artistId,
  companyName: schema.bookingRequests.companyName,
  companyVerified: schema.bookingRequests.companyVerified,
  companyEventCount: schema.bookingRequests.companyEventCount,
  eventType: schema.bookingRequests.eventType,
  budget: schema.bookingRequests.budget,
  location: schema.bookingRequests.location,
  eventDate: schema.bookingRequests.eventDate,
  message: schema.bookingRequests.message,
  status: schema.bookingRequests.status,
  advancing: schema.bookingRequests.advancing,
  createdAt: schema.bookingRequests.createdAt,
  artistName: schema.artists.name,
};

type Row = {
  id: string;
  artistId: string;
  companyName: string | null;
  companyVerified: boolean;
  companyEventCount: number | null;
  eventType: string;
  budget: number;
  location: string | null;
  eventDate: string | null;
  message: string | null;
  status: BookingStatus;
  advancing: string[];
  createdAt: Date;
  artistName: string | null;
};

function rowToRequest(r: Row): BookingRequest {
  return {
    id: r.id,
    artistId: r.artistId,
    artistName: r.artistName ?? "",
    companyName: r.companyName ?? "주최자",
    companyVerified: r.companyVerified,
    companyEventCount: r.companyEventCount ?? undefined,
    eventType: r.eventType as EventType,
    budget: r.budget,
    location: r.location ?? "",
    date: r.eventDate ?? "",
    message: r.message ?? "",
    status: r.status,
    advancingChecked: r.advancing ?? [],
    createdAt: r.createdAt.toISOString(),
  };
}

/**
 * 섭외 요청 목록.
 * scope.agencyId → 그 소속사 아티스트의 요청만 (실 소속사 격리, 빈 목록 그대로)
 * scope.companyUserId → 그 광고주가 보낸 요청만 (본인 요청 있을 때만, 없으면 데모)
 * scope 없음 → 전체 (데모/테스터)
 */
export async function getBookingRequests(scope?: {
  agencyId?: string;
  companyUserId?: string;
}): Promise<BookingRequest[]> {
  try {
    const db = getDb();
    const buildQuery = (where?: ReturnType<typeof eq>) => {
      const q = db
        .select(cols)
        .from(schema.bookingRequests)
        .leftJoin(
          schema.artists,
          eq(schema.bookingRequests.artistId, schema.artists.id)
        );
      return (where ? q.where(where) : q).orderBy(
        desc(schema.bookingRequests.createdAt)
      );
    };

    if (scope?.agencyId) {
      const rows = await buildQuery(
        eq(schema.artists.agencyId, scope.agencyId)
      );
      return (rows as Row[]).map(rowToRequest);
    }
    if (scope?.companyUserId) {
      const rows = await buildQuery(
        eq(schema.bookingRequests.companyUserId, scope.companyUserId)
      );
      if (rows.length > 0) return (rows as Row[]).map(rowToRequest);
      // 본인 요청이 아직 없으면 데모 전체
      return getBookingRequests();
    }
    const rows = await buildQuery();
    if (rows.length > 0) return (rows as Row[]).map(rowToRequest);
  } catch {
    /* 폴백 */
  }
  return MOCK;
}
