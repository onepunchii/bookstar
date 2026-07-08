// 관리자 대시보드 데이터 — 전체 가입자·유입·섭외 현황 집계.
// users.role='admin' 계정만 접근(페이지에서 가드).
import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSessionUser, type SessionUser } from "@/lib/data/session";

// 관리자 여부 가드 — 각 관리자 페이지 상단에서 호출.
export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getSessionUser();
  return user && user.role === "admin" ? user : null;
}

export interface AdminOverview {
  totals: {
    users: number;
    advertisers: number; // company
    agencies: number; // 소속사 유저
    artists: number; // 크리에이터 유저(role=artist)
    admins: number;
    kakaoUsers: number; // 실제 카카오 로그인 유입
    seedUsers: number; // kakao_id 없는 시드
  };
  entities: {
    agencies: number; // agencies 테이블
    artists: number; // artists 테이블
    bookingRequests: number;
    outreachContacts: number;
    pendingReplies: number;
  };
  recentUsers: {
    id: string;
    name: string;
    role: string;
    accountType: string | null;
    company: string | null;
    source: "kakao" | "seed";
    createdAt: string;
  }[];
  recentBookings: {
    id: string;
    companyName: string | null;
    status: string;
    createdAt: string;
  }[];
}

const countOf = (v: unknown) => Number((v as { c: number }[] | undefined)?.[0]?.c ?? 0);

export async function getAdminOverview(): Promise<AdminOverview> {
  const db = getDb();

  const [
    byRole,
    kakaoCount,
    agenciesCount,
    artistsCount,
    bookingsCount,
    outreachCount,
    pendingCount,
    recentUsers,
    recentBookings,
  ] = await Promise.all([
    db
      .select({
        role: schema.users.role,
        c: sql<number>`count(*)::int`,
      })
      .from(schema.users)
      .groupBy(schema.users.role),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.users)
      .where(sql`${schema.users.kakaoId} is not null`),
    db.select({ c: sql<number>`count(*)::int` }).from(schema.agencies),
    db.select({ c: sql<number>`count(*)::int` }).from(schema.artists),
    db.select({ c: sql<number>`count(*)::int` }).from(schema.bookingRequests),
    db.select({ c: sql<number>`count(*)::int` }).from(schema.outreachContacts),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(schema.outreachReplies)
      .where(sql`${schema.outreachReplies.status} = 'pending'`),
    db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        role: schema.users.role,
        accountType: schema.users.accountType,
        company: schema.users.company,
        kakaoId: schema.users.kakaoId,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt))
      .limit(50),
    db
      .select({
        id: schema.bookingRequests.id,
        companyName: schema.bookingRequests.companyName,
        status: schema.bookingRequests.status,
        createdAt: schema.bookingRequests.createdAt,
      })
      .from(schema.bookingRequests)
      .orderBy(desc(schema.bookingRequests.createdAt))
      .limit(20),
  ]);

  const roleMap: Record<string, number> = {};
  for (const r of byRole) roleMap[r.role] = Number(r.c);
  const totalUsers = Object.values(roleMap).reduce((a, b) => a + b, 0);
  const kakaoUsers = countOf(kakaoCount);

  return {
    totals: {
      users: totalUsers,
      advertisers: roleMap.company ?? 0,
      agencies: roleMap.agency ?? 0,
      artists: roleMap.artist ?? 0,
      admins: roleMap.admin ?? 0,
      kakaoUsers,
      seedUsers: totalUsers - kakaoUsers,
    },
    entities: {
      agencies: countOf(agenciesCount),
      artists: countOf(artistsCount),
      bookingRequests: countOf(bookingsCount),
      outreachContacts: countOf(outreachCount),
      pendingReplies: countOf(pendingCount),
    },
    recentUsers: recentUsers.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      accountType: u.accountType,
      company: u.company,
      source: u.kakaoId ? "kakao" : "seed",
      createdAt: u.createdAt.toISOString(),
    })),
    recentBookings: recentBookings.map((b) => ({
      id: b.id,
      companyName: b.companyName,
      status: b.status,
      createdAt: b.createdAt.toISOString(),
    })),
  };
}

// ── 가입자 상세 ─────────────────────────────
export interface AdminUserRow {
  id: string;
  name: string;
  role: string;
  accountType: string | null;
  company: string | null;
  phone: string | null;
  email: string | null;
  kakaoId: string | null;
  createdAt: string;
}

export async function getAdminUsers(): Promise<AdminUserRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt));
  return rows.map((u) => ({
    id: u.id,
    name: u.name,
    role: u.role,
    accountType: u.accountType,
    company: u.company,
    phone: u.phone,
    email: u.email,
    kakaoId: u.kakaoId,
    createdAt: u.createdAt.toISOString(),
  }));
}

// ── 소속사 상세 (아티스트 수 포함) ───────────
export interface AdminAgencyRow {
  id: string;
  companyName: string;
  agencyType: string;
  plan: string;
  manager: string | null;
  phone: string | null;
  email: string | null;
  verified: boolean;
  artistCount: number;
  createdAt: string;
}

export async function getAdminAgencies(): Promise<AdminAgencyRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.agencies.id,
      companyName: schema.agencies.companyName,
      agencyType: schema.agencies.agencyType,
      plan: schema.agencies.plan,
      manager: schema.agencies.manager,
      phone: schema.agencies.phone,
      email: schema.agencies.email,
      verified: schema.agencies.verified,
      createdAt: schema.agencies.createdAt,
      artistCount: sql<number>`(
        select count(*)::int from ${schema.artists}
        where ${schema.artists.agencyId} = ${schema.agencies.id}
      )`,
    })
    .from(schema.agencies)
    .orderBy(desc(schema.agencies.createdAt));
  return rows.map((a) => ({
    id: a.id,
    companyName: a.companyName,
    agencyType: a.agencyType,
    plan: a.plan,
    manager: a.manager,
    phone: a.phone,
    email: a.email,
    verified: a.verified,
    artistCount: Number(a.artistCount),
    createdAt: a.createdAt.toISOString(),
  }));
}

// ── 아티스트 상세 ────────────────────────────
export interface AdminArtistRow {
  id: string;
  name: string;
  groupName: string | null;
  agencyName: string | null;
  categories: string[];
  followers: number | null;
  status: string;
  verified: boolean;
  slug: string | null;
  createdAt: string;
}

export async function getAdminArtists(): Promise<AdminArtistRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.artists.id,
      name: schema.artists.name,
      groupName: schema.artists.groupName,
      agencyName: schema.artists.agencyName,
      categories: schema.artists.categories,
      followers: schema.artists.followers,
      status: schema.artists.status,
      verified: schema.artists.verified,
      slug: schema.artists.slug,
      createdAt: schema.artists.createdAt,
    })
    .from(schema.artists)
    .orderBy(desc(schema.artists.createdAt));
  return rows.map((a) => ({
    id: a.id,
    name: a.name,
    groupName: a.groupName,
    agencyName: a.agencyName,
    categories: (a.categories as string[]) ?? [],
    followers: a.followers,
    status: a.status,
    verified: a.verified,
    slug: a.slug,
    createdAt: a.createdAt.toISOString(),
  }));
}

// ── 섭외 요청 상세 (아티스트명 조인) ─────────
export interface AdminBookingRow {
  id: string;
  companyName: string | null;
  artistName: string | null;
  eventType: string | null;
  budget: number | null;
  location: string | null;
  eventDate: string | null;
  status: string;
  source: string | null;
  createdAt: string;
}

export async function getAdminBookings(): Promise<AdminBookingRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.bookingRequests.id,
      companyName: schema.bookingRequests.companyName,
      artistName: schema.artists.name,
      eventType: schema.bookingRequests.eventType,
      budget: schema.bookingRequests.budget,
      location: schema.bookingRequests.location,
      eventDate: schema.bookingRequests.eventDate,
      status: schema.bookingRequests.status,
      source: schema.bookingRequests.source,
      createdAt: schema.bookingRequests.createdAt,
    })
    .from(schema.bookingRequests)
    .leftJoin(
      schema.artists,
      eq(schema.bookingRequests.artistId, schema.artists.id)
    )
    .orderBy(desc(schema.bookingRequests.createdAt));
  return rows.map((b) => ({
    id: b.id,
    companyName: b.companyName,
    artistName: b.artistName,
    eventType: b.eventType,
    budget: b.budget,
    location: b.location,
    eventDate: b.eventDate,
    status: b.status,
    source: b.source,
    createdAt: b.createdAt.toISOString(),
  }));
}
