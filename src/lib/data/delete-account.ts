// 계정 영구 삭제 — 이 유저가 소유/생성한 모든 데이터를 FK 안전 순서로 삭제.
// App Store 5.1.1(v)·개인정보 파기. 복구 불가.
// 범위: 유저의 소속사 + 그 소속사의 아티스트 + 그 아티스트에 걸린 모든 데이터
//       (다른 광고주가 보낸 요청·메시지 포함), 유저의 광고주 요청·캠페인·알림 등.
// neon-http는 인터랙티브 트랜잭션이 없어 단일 statement를 FK 순서로 순차 실행한다.
import { and, eq, inArray, or } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface DeleteAccountResult {
  ok: boolean;
  appleRefreshToken: string | null; // 있으면 라우트에서 Apple revoke 호출
}

export async function deleteAccount(
  userId: string
): Promise<DeleteAccountResult> {
  const db = getDb();

  // 삭제 전 Apple refresh token 확보(있으면) — 유저 행 삭제 후엔 못 읽으므로 먼저.
  let appleRefreshToken: string | null = null;
  try {
    const [u] = await db
      .select({ t: schema.users.appleRefreshToken })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    appleRefreshToken = u?.t ?? null;
  } catch {
    /* 컬럼 없거나 조회 실패 — revoke만 건너뜀 */
  }

  // 1) 소유 범위 수집: 소속사, 아티스트, 요청, 캠페인
  const [ownedAgency] = await db
    .select({ id: schema.agencies.id })
    .from(schema.agencies)
    .where(eq(schema.agencies.ownerId, userId))
    .limit(1);
  const agencyId = ownedAgency?.id ?? null;

  const artistRows = await db
    .select({ id: schema.artists.id })
    .from(schema.artists)
    .where(
      agencyId
        ? or(
            eq(schema.artists.agencyId, agencyId),
            eq(schema.artists.userId, userId)
          )
        : eq(schema.artists.userId, userId)
    );
  const artistIds = artistRows.map((r) => r.id);

  const reqRows = await db
    .select({ id: schema.bookingRequests.id })
    .from(schema.bookingRequests)
    .where(
      artistIds.length
        ? or(
            eq(schema.bookingRequests.companyUserId, userId),
            inArray(schema.bookingRequests.artistId, artistIds)
          )
        : eq(schema.bookingRequests.companyUserId, userId)
    );
  const requestIds = reqRows.map((r) => r.id);

  const campRows = await db
    .select({ id: schema.campaigns.id })
    .from(schema.campaigns)
    .where(eq(schema.campaigns.companyUserId, userId));
  const campaignIds = campRows.map((r) => r.id);

  // 2) 자식 → 부모 순서로 삭제
  // 2-1) 요청/아티스트/소속사에 딸린 것들
  if (requestIds.length) {
    await db
      .delete(schema.messages)
      .where(inArray(schema.messages.requestId, requestIds));
    await db
      .delete(schema.quotes)
      .where(inArray(schema.quotes.requestId, requestIds));
    await db
      .delete(schema.bookingStatusHistory)
      .where(inArray(schema.bookingStatusHistory.requestId, requestIds));
  }

  // 캠페인 지원 — 요청/캠페인/아티스트/소속사/지원자 어느 쪽이든 이 유저 연관이면 삭제
  {
    const conds = [eq(schema.campaignApplications.applicantUserId, userId)];
    if (campaignIds.length)
      conds.push(inArray(schema.campaignApplications.campaignId, campaignIds));
    if (artistIds.length)
      conds.push(inArray(schema.campaignApplications.artistId, artistIds));
    if (requestIds.length)
      conds.push(inArray(schema.campaignApplications.requestId, requestIds));
    if (agencyId)
      conds.push(eq(schema.campaignApplications.agencyId, agencyId));
    await db.delete(schema.campaignApplications).where(or(...conds));
  }

  // 정산·서류·홀드 (요청 또는 아티스트 기준)
  {
    const sConds = [];
    if (requestIds.length)
      sConds.push(inArray(schema.settlements.requestId, requestIds));
    if (artistIds.length)
      sConds.push(inArray(schema.settlements.artistId, artistIds));
    if (sConds.length) await db.delete(schema.settlements).where(or(...sConds));
  }
  {
    const dConds = [];
    if (requestIds.length)
      dConds.push(inArray(schema.documents.requestId, requestIds));
    if (artistIds.length)
      dConds.push(inArray(schema.documents.artistId, artistIds));
    if (agencyId) dConds.push(eq(schema.documents.agencyId, agencyId));
    if (dConds.length) await db.delete(schema.documents).where(or(...dConds));
  }
  {
    const hConds = [];
    if (requestIds.length)
      hConds.push(inArray(schema.holds.requestId, requestIds));
    if (artistIds.length)
      hConds.push(inArray(schema.holds.artistId, artistIds));
    if (hConds.length) await db.delete(schema.holds).where(or(...hConds));
  }

  // 아티스트 자식: 일정·데일리·휴가
  if (artistIds.length) {
    await db
      .delete(schema.schedules)
      .where(inArray(schema.schedules.artistId, artistIds));
    await db
      .delete(schema.daySchedules)
      .where(inArray(schema.daySchedules.artistId, artistIds));
    await db
      .delete(schema.leaves)
      .where(inArray(schema.leaves.artistId, artistIds));
  }

  // 소속사 자식: 매니저·번들
  if (agencyId) {
    await db
      .delete(schema.managers)
      .where(eq(schema.managers.agencyId, agencyId));
    await db.delete(schema.bundles).where(eq(schema.bundles.agencyId, agencyId));
  }

  // 2-2) 요청·캠페인 본체
  if (requestIds.length)
    await db
      .delete(schema.bookingRequests)
      .where(inArray(schema.bookingRequests.id, requestIds));
  if (campaignIds.length)
    await db
      .delete(schema.campaigns)
      .where(inArray(schema.campaigns.id, campaignIds));

  // 2-3) 아티스트·소속사
  if (artistIds.length)
    await db.delete(schema.artists).where(inArray(schema.artists.id, artistIds));
  if (agencyId)
    await db.delete(schema.agencies).where(eq(schema.agencies.id, agencyId));

  // 3) 유저 직속 데이터
  await db
    .delete(schema.notifications)
    .where(eq(schema.notifications.userId, userId));
  await db.delete(schema.feedbacks).where(eq(schema.feedbacks.userId, userId));
  await db.delete(schema.errorLogs).where(eq(schema.errorLogs.userId, userId));
  await db
    .delete(schema.contentReports)
    .where(eq(schema.contentReports.reporterId, userId));
  await db
    .delete(schema.blockedUsers)
    .where(
      or(
        eq(schema.blockedUsers.blockerId, userId),
        eq(schema.blockedUsers.blockedId, userId)
      )
    );

  // 4) 남의 데이터에 남은 이 유저 참조는 익명화(nullable FK) — 삭제 안 하고 신원만 제거
  await db
    .update(schema.messages)
    .set({ senderUserId: null })
    .where(eq(schema.messages.senderUserId, userId));
  await db
    .update(schema.quotes)
    .set({ createdByUserId: null })
    .where(eq(schema.quotes.createdByUserId, userId));
  await db
    .update(schema.leaves)
    .set({ decidedByUserId: null })
    .where(eq(schema.leaves.decidedByUserId, userId));
  await db
    .update(schema.bookingStatusHistory)
    .set({ actorUserId: null })
    .where(eq(schema.bookingStatusHistory.actorUserId, userId));
  await db
    .update(schema.campaignApplications)
    .set({ applicantUserId: null })
    .where(eq(schema.campaignApplications.applicantUserId, userId));

  // 5) 마지막으로 유저 삭제
  await db.delete(schema.users).where(eq(schema.users.id, userId));

  return { ok: true, appleRefreshToken };
}
