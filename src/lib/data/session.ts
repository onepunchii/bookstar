// 진입(identity) 로직 — 카카오 로그인 유저 ↔ users ↔ 소속사/아티스트 연결.
// 데모(비로그인·미가입)는 테스터 읽기전용 샘플, 가입하면 본인 실데이터.
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";

export interface SessionUser {
  id: string; // users.id (DB)
  role: "company" | "agency" | "admin" | "artist";
  name: string;
}

// 현재 세션의 DB 유저 (없으면 null = 데모/비로그인)
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return {
    id,
    role: (session.user.role as SessionUser["role"]) ?? "company",
    name: session.user.name ?? "사용자",
  };
}

export interface SessionProfile {
  id: string;
  name: string;
  company: string | null;
  accountType: string; // personal | business
  phone: string | null;
  email: string | null;
}

// 로그인 유저의 전체 프로필 행 (광고주 계정 페이지용)
export async function getSessionProfile(): Promise<SessionProfile | null> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return null;
  try {
    const db = getDb();
    const [row] = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        company: schema.users.company,
        accountType: schema.users.accountType,
        phone: schema.users.phone,
        email: schema.users.email,
      })
      .from(schema.users)
      .where(eq(schema.users.id, uid))
      .limit(1);
    return row ?? null;
  } catch {
    return null;
  }
}

export interface SessionAgency {
  id: string;
  companyName: string;
  agencyType: string; // solo | company
  plan: string; // free | growth | enterprise
  manager: string | null;
  phone: string | null;
  email: string | null;
  verificationStatus: string; // pending | verified | rejected
  businessDocUrl: string | null;
}

// 로그인 유저가 소유한 소속사 (없으면 null → 데모)
export async function getSessionAgency(): Promise<SessionAgency | null> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return null;
  try {
    const db = getDb();
    const [agency] = await db
      .select({
        id: schema.agencies.id,
        companyName: schema.agencies.companyName,
        agencyType: schema.agencies.agencyType,
        plan: schema.agencies.plan,
        manager: schema.agencies.manager,
        phone: schema.agencies.phone,
        email: schema.agencies.email,
        verificationStatus: schema.agencies.verificationStatus,
        businessDocUrl: schema.agencies.businessDocUrl,
      })
      .from(schema.agencies)
      .where(eq(schema.agencies.ownerId, uid))
      .limit(1);
    return agency ?? null;
  } catch {
    return null;
  }
}

// 소속사 자격 상태 — 토글/가드용. none = 소속사 미신청.
export type AgencyCapability = "none" | "pending" | "verified" | "rejected";
export async function getAgencyCapability(): Promise<AgencyCapability> {
  const a = await getSessionAgency();
  if (!a) return "none";
  return (a.verificationStatus as AgencyCapability) ?? "pending";
}

// 로그인 유저에 연결된 아티스트 (크리에이터 계정, 없으면 null → 데모)
export async function getSessionArtistId(): Promise<string | null> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return null;
  try {
    const db = getDb();
    const [artist] = await db
      .select({ id: schema.artists.id })
      .from(schema.artists)
      .where(eq(schema.artists.userId, uid))
      .limit(1);
    return artist?.id ?? null;
  } catch {
    return null;
  }
}
