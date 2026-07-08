// 오픈 캠페인(역방향 캐스팅) 데이터 레이어.
// 광고주가 캠페인 공개 → 소속사가 아티스트 지정해 지원 → 광고주 선정 → booking_requests로 전환.
import { and, asc, desc, eq, gte, inArray, ne, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { todayKST } from "@/lib/date";
import { notify } from "@/lib/data/notify";

export interface CampaignInput {
  companyUserId: string;
  companyName?: string | null;
  title: string;
  eventType: string;
  categories: string[];
  budgetMin?: number | null;
  budgetMax?: number | null;
  location?: string | null;
  eventDate?: string | null;
  deadline: string;
  description?: string | null;
  imageUrl?: string | null;
}

export interface CampaignCard {
  id: string;
  title: string;
  eventType: string;
  categories: string[];
  budgetMin: number | null;
  budgetMax: number | null;
  location: string | null;
  eventDate: string | null;
  deadline: string;
  description: string | null;
  imageUrl: string | null;
  status: string;
  companyName: string | null;
  applicantCount: number;
  createdAt: string;
}

export interface Applicant {
  id: string;
  artistId: string;
  artistName: string;
  artistSlug: string | null;
  artistImage: string | null;
  agencyName: string | null;
  categories: string[];
  followers: number;
  pitch: string | null;
  proposedFee: number | null;
  proposedIncludes: string | null;
  status: string;
  requestId: string | null;
  createdAt: string;
  recommended?: boolean; // 적합도 최상위 후보
}

// 캠페인 대비 지원자 적합도 점수 — 카테고리 매칭·팔로워·예산 적합
function fitScore(
  a: Applicant,
  campaign: { categories: string[]; budgetMin: number | null; budgetMax: number | null }
): number {
  let s = 0;
  const camCats = new Set(campaign.categories);
  s += a.categories.filter((c) => camCats.has(c)).length * 100; // 카테고리 매칭 최우선
  s += Math.min(a.followers / 10000, 50); // 팔로워 규모(상한)
  if (
    a.proposedFee != null &&
    (campaign.budgetMin == null || a.proposedFee >= campaign.budgetMin) &&
    (campaign.budgetMax == null || a.proposedFee <= campaign.budgetMax)
  )
    s += 30; // 예산 범위 안
  return s;
}

// 마감 지난 open 캠페인은 표시상 closed로 취급
function effectiveStatus(status: string, deadline: string): string {
  if (status === "open" && deadline < todayKST()) return "closed";
  return status;
}

// ── 생성 ─────────────────────────────
export async function createCampaign(input: CampaignInput): Promise<string> {
  const db = getDb();
  const [row] = await db
    .insert(schema.campaigns)
    .values({
      companyUserId: input.companyUserId,
      companyName: input.companyName ?? null,
      title: input.title,
      eventType: input.eventType,
      categories: input.categories,
      budgetMin: input.budgetMin ?? null,
      budgetMax: input.budgetMax ?? null,
      location: input.location ?? null,
      eventDate: input.eventDate ?? null,
      deadline: input.deadline,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
    })
    .returning({ id: schema.campaigns.id });
  return row.id;
}

// 모집 중(open·마감 전) 오픈 캠페인 수 — 소속사 대시보드 훅.
export async function countOpenCampaigns(): Promise<number> {
  const db = getDb();
  const [r] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(schema.campaigns)
    .where(
      and(
        eq(schema.campaigns.status, "open"),
        gte(schema.campaigns.deadline, todayKST())
      )
    );
  return Number(r?.c ?? 0);
}

// ── 광고주: 내 캠페인 목록 ────────────
export async function getCompanyCampaigns(
  companyUserId: string
): Promise<CampaignCard[]> {
  const db = getDb();
  const rows = await db
    .select({
      c: schema.campaigns,
      applicantCount: sql<number>`(
        select count(*)::int from ${schema.campaignApplications}
        where ${schema.campaignApplications.campaignId} = ${schema.campaigns.id}
      )`,
    })
    .from(schema.campaigns)
    .where(eq(schema.campaigns.companyUserId, companyUserId))
    .orderBy(desc(schema.campaigns.createdAt));
  return rows.map(({ c, applicantCount }) => toCard(c, Number(applicantCount)));
}

// ── 광고주: 캠페인 상세 + 지원자 (소유 검증) ──
export async function getCompanyCampaign(
  id: string,
  companyUserId: string
): Promise<{ campaign: CampaignCard; applicants: Applicant[] } | null> {
  const db = getDb();
  const [c] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, id))
    .limit(1);
  if (!c || c.companyUserId !== companyUserId) return null;
  const applicants = await loadApplicants(id);
  // 적합도순 정렬 + 최상위 후보 추천 배지 (지원 2명 이상, 미선정 상태일 때만)
  const cam = {
    categories: (c.categories as string[]) ?? [],
    budgetMin: c.budgetMin,
    budgetMax: c.budgetMax,
  };
  applicants.sort((x, y) => fitScore(y, cam) - fitScore(x, cam));
  if (applicants.length > 1 && c.status !== "awarded" && applicants[0])
    applicants[0].recommended = true;
  return { campaign: toCard(c, applicants.length), applicants };
}

// ── 소속사: 오픈 캠페인 피드 ───────────
export interface FeedItem extends CampaignCard {
  matched: boolean; // 내 라인업 카테고리와 겹침
  myApplication: { artistId: string; status: string } | null;
}

export async function getAgencyFeed(
  agencyId: string | null
): Promise<FeedItem[]> {
  const db = getDb();
  const today = todayKST();
  const open = await db
    .select()
    .from(schema.campaigns)
    .where(and(eq(schema.campaigns.status, "open"), gte(schema.campaigns.deadline, today)))
    .orderBy(asc(schema.campaigns.deadline));

  let myCats = new Set<string>();
  let myApps: { campaignId: string; artistId: string; status: string }[] = [];
  if (agencyId) {
    const arts = await db
      .select({ id: schema.artists.id, categories: schema.artists.categories })
      .from(schema.artists)
      .where(eq(schema.artists.agencyId, agencyId));
    myCats = new Set(arts.flatMap((a) => (a.categories as string[]) ?? []));
    const ids = arts.map((a) => a.id);
    if (ids.length) {
      myApps = await db
        .select({
          campaignId: schema.campaignApplications.campaignId,
          artistId: schema.campaignApplications.artistId,
          status: schema.campaignApplications.status,
        })
        .from(schema.campaignApplications)
        .where(inArray(schema.campaignApplications.artistId, ids));
    }
  }
  const appByCampaign = new Map(myApps.map((a) => [a.campaignId, a]));

  const items = open.map((c) => {
    const cats = (c.categories as string[]) ?? [];
    const matched = cats.some((x) => myCats.has(x));
    const mine = appByCampaign.get(c.id);
    return {
      ...toCard(c, 0),
      matched,
      myApplication: mine ? { artistId: mine.artistId, status: mine.status } : null,
    };
  });
  // 우리 라인업 카테고리에 맞는 캠페인을 위로 (마감 임박순은 그룹 내 유지 — 안정 정렬)
  return items.sort((a, b) => Number(b.matched) - Number(a.matched));
}

// 소속사 지원용 캠페인 단건
export async function getFeedCampaign(id: string): Promise<CampaignCard | null> {
  const db = getDb();
  const [c] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, id))
    .limit(1);
  return c ? toCard(c, 0) : null;
}

// ── 소속사: 지원 ──────────────────────
export async function applyToCampaign(input: {
  campaignId: string;
  artistId: string;
  agencyId?: string | null;
  applicantUserId?: string | null;
  pitch?: string | null;
  proposedFee?: number | null;
  proposedIncludes?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const [c] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, input.campaignId))
    .limit(1);
  if (!c) return { ok: false, error: "캠페인을 찾을 수 없어요" };
  if (c.status !== "open" || c.deadline < todayKST())
    return { ok: false, error: "이미 마감된 캠페인이에요" };

  try {
    await db.insert(schema.campaignApplications).values({
      campaignId: input.campaignId,
      artistId: input.artistId,
      agencyId: input.agencyId ?? null,
      applicantUserId: input.applicantUserId ?? null,
      pitch: input.pitch ?? null,
      proposedFee: input.proposedFee ?? null,
      proposedIncludes: input.proposedIncludes ?? null,
    });
  } catch {
    return { ok: false, error: "이미 이 아티스트로 지원했어요" };
  }

  const [artist] = await db
    .select({ name: schema.artists.name })
    .from(schema.artists)
    .where(eq(schema.artists.id, input.artistId))
    .limit(1);
  await notify(c.companyUserId, {
    type: "campaign_application",
    title: "새 지원이 도착했어요",
    body: `${artist?.name ?? "아티스트"} · ${c.title}`,
    link: `/requests/campaigns/${c.id}`,
  });
  return { ok: true };
}

// ── 광고주: 지원자 선정 → 부킹 전환 ────
export async function selectApplication(
  campaignId: string,
  applicationId: string,
  companyUserId: string
): Promise<{ ok: boolean; requestId?: string; error?: string }> {
  const db = getDb();
  const [c] = await db
    .select()
    .from(schema.campaigns)
    .where(eq(schema.campaigns.id, campaignId))
    .limit(1);
  if (!c || c.companyUserId !== companyUserId)
    return { ok: false, error: "권한이 없어요" };
  if (c.status === "awarded")
    return { ok: false, error: "이미 선정이 끝난 캠페인이에요" };

  const [app] = await db
    .select()
    .from(schema.campaignApplications)
    .where(eq(schema.campaignApplications.id, applicationId))
    .limit(1);
  if (!app || app.campaignId !== campaignId)
    return { ok: false, error: "지원을 찾을 수 없어요" };

  // 1) 부킹 생성 (기존 협의·정산·데일리 흐름으로 진입)
  const budget = app.proposedFee ?? c.budgetMax ?? c.budgetMin ?? 0;
  const [req] = await db
    .insert(schema.bookingRequests)
    .values({
      companyUserId,
      artistId: app.artistId,
      companyName: c.companyName,
      eventType: c.eventType,
      budget,
      location: c.location,
      eventDate: c.eventDate,
      message: app.pitch,
      source: "open_casting",
      status: "reviewing",
    })
    .returning({ id: schema.bookingRequests.id });

  // 2) 지원 컨텍스트를 협의 스레드로 이월 (제안 메시지·견적)
  if (app.pitch) {
    await db.insert(schema.messages).values({
      requestId: req.id,
      sender: "agency",
      body: app.pitch,
    });
  }
  if (app.proposedFee) {
    await db.insert(schema.quotes).values({
      requestId: req.id,
      amount: app.proposedFee,
      includes: app.proposedIncludes ?? null,
    });
  }

  // 3) 상태 갱신 — 선정/미선정, 캠페인 마감
  await db
    .update(schema.campaignApplications)
    .set({ status: "selected", requestId: req.id })
    .where(eq(schema.campaignApplications.id, applicationId));
  await db
    .update(schema.campaignApplications)
    .set({ status: "rejected" })
    .where(
      and(
        eq(schema.campaignApplications.campaignId, campaignId),
        ne(schema.campaignApplications.id, applicationId)
      )
    );
  await db
    .update(schema.campaigns)
    .set({ status: "awarded", awardedApplicationId: applicationId })
    .where(eq(schema.campaigns.id, campaignId));

  // 4) 알림 — 선정자·미선정자
  if (app.applicantUserId)
    await notify(app.applicantUserId, {
      type: "campaign_selected",
      title: "축하해요, 선정됐어요!",
      body: `${c.title} · 협의가 시작됐어요`,
      link: `/agency/inbox`,
    });
  const others = await db
    .select({ uid: schema.campaignApplications.applicantUserId })
    .from(schema.campaignApplications)
    .where(
      and(
        eq(schema.campaignApplications.campaignId, campaignId),
        ne(schema.campaignApplications.id, applicationId)
      )
    );
  for (const o of others) {
    if (o.uid)
      await notify(o.uid, {
        type: "campaign_rejected",
        title: "이번엔 선정되지 않았어요",
        body: `${c.title} · 다른 캠페인도 확인해보세요`,
        link: `/agency/campaigns`,
      });
  }

  return { ok: true, requestId: req.id };
}

// ── 광고주: 마감/기한 연장 ────────────
export async function closeCampaign(id: string, companyUserId: string) {
  const db = getDb();
  await db
    .update(schema.campaigns)
    .set({ status: "closed" })
    .where(
      and(
        eq(schema.campaigns.id, id),
        eq(schema.campaigns.companyUserId, companyUserId),
        eq(schema.campaigns.status, "open")
      )
    );
}

export async function extendDeadline(
  id: string,
  companyUserId: string,
  deadline: string
) {
  const db = getDb();
  await db
    .update(schema.campaigns)
    .set({ deadline, status: "open" })
    .where(
      and(
        eq(schema.campaigns.id, id),
        eq(schema.campaigns.companyUserId, companyUserId)
      )
    );
}

// ── helpers ──────────────────────────
type CampaignRow = typeof schema.campaigns.$inferSelect;
function toCard(c: CampaignRow, applicantCount: number): CampaignCard {
  return {
    id: c.id,
    title: c.title,
    eventType: c.eventType,
    categories: (c.categories as string[]) ?? [],
    budgetMin: c.budgetMin,
    budgetMax: c.budgetMax,
    location: c.location,
    eventDate: c.eventDate,
    deadline: c.deadline,
    description: c.description,
    imageUrl: c.imageUrl,
    status: effectiveStatus(c.status, c.deadline),
    companyName: c.companyName,
    applicantCount,
    createdAt: c.createdAt.toISOString(),
  };
}

async function loadApplicants(campaignId: string): Promise<Applicant[]> {
  const db = getDb();
  const rows = await db
    .select({
      a: schema.campaignApplications,
      artistName: schema.artists.name,
      artistSlug: schema.artists.slug,
      artistImage: schema.artists.imageUrl,
      agencyName: schema.artists.agencyName,
      categories: schema.artists.categories,
      followers: schema.artists.followers,
    })
    .from(schema.campaignApplications)
    .leftJoin(
      schema.artists,
      eq(schema.campaignApplications.artistId, schema.artists.id)
    )
    .where(eq(schema.campaignApplications.campaignId, campaignId))
    .orderBy(desc(schema.campaignApplications.createdAt));
  return rows.map(({ a, ...j }) => ({
    id: a.id,
    artistId: a.artistId,
    artistName: j.artistName ?? "아티스트",
    artistSlug: j.artistSlug ?? null,
    artistImage: j.artistImage ?? null,
    agencyName: j.agencyName ?? null,
    categories: (j.categories as string[]) ?? [],
    followers: j.followers ?? 0,
    pitch: a.pitch,
    proposedFee: a.proposedFee,
    proposedIncludes: a.proposedIncludes,
    status: a.status,
    requestId: a.requestId,
    createdAt: a.createdAt.toISOString(),
  }));
}
