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
      // 본인 요청이 아직 없으면 데모 샘플만(전체 실데이터로 폴백하면 크로스테넌트 유출)
      return MOCK;
    }
    // 스코프 없음 = 데모(비로그인·미가입). 실데이터는 항상 스코프로만 조회한다.
  } catch {
    /* 폴백 */
  }
  return MOCK;
}

// 단건 조회 — 상세 페이지가 참여자 확인 후 표시 데이터를 가져올 때(전체 스캔 회피).
export async function getBookingRequestById(
  id: string
): Promise<BookingRequest | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select(cols)
      .from(schema.bookingRequests)
      .leftJoin(
        schema.artists,
        eq(schema.bookingRequests.artistId, schema.artists.id)
      )
      .where(eq(schema.bookingRequests.id, id))
      .limit(1);
    if (row) return rowToRequest(row as Row);
  } catch {
    /* 폴백 */
  }
  // 실 DB에 없으면 데모 샘플 폴백 — 데모 요청 상세도 열람 가능하게(목록·홈과 일관)
  return MOCK.find((m) => m.id === id) ?? null;
}

// 비로그인 데모용 — 실제 요청 대신 항상 샘플만 노출(실 광고주 데이터 유출 방지).
export function getDemoBookingRequests(): BookingRequest[] {
  return MOCK;
}

// 접근 통제용 — 요청 당사자 식별자(광고주 uid + 담당 소속사 id). 없으면 null(데모/미존재).
export async function getRequestParties(id: string): Promise<{
  companyUserId: string;
  artistId: string;
  agencyId: string | null;
  demo?: boolean;
} | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select({
        companyUserId: schema.bookingRequests.companyUserId,
        artistId: schema.bookingRequests.artistId,
        agencyId: schema.artists.agencyId,
      })
      .from(schema.bookingRequests)
      .leftJoin(
        schema.artists,
        eq(schema.bookingRequests.artistId, schema.artists.id)
      )
      .where(eq(schema.bookingRequests.id, id))
      .limit(1);
    if (row) return row;
  } catch {
    /* 폴백 */
  }
  // 데모 요청(MOCK)이면 누구나 열람 가능 — 실제 개인정보 아님(홈·목록에 공개된 샘플)
  const m = MOCK.find((x) => x.id === id);
  return m
    ? { companyUserId: "__demo__", artistId: m.artistId, agencyId: null, demo: true }
    : null;
}
