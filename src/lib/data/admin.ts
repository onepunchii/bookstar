// 관리자 대시보드 데이터 — 전체 가입자·유입·섭외 현황 집계.
// users.role='admin' 계정만 접근(페이지에서 가드).
import { desc, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

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
