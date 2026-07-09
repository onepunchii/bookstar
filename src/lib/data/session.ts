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

// 세션 uid가 실제 users 행인지 확인 — 삭제된 계정을 가리키는 유령 토큰(FK 위반) 방어.
export async function sessionUserExists(uid: string): Promise<boolean> {
  try {
    const db = getDb();
    const [u] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.id, uid))
      .limit(1);
    return !!u;
  } catch {
    return false;
  }
}

export const STALE_SESSION_MSG =
  "로그인 정보가 오래됐어요. 로그아웃 후 다시 로그인해 주세요.";

// 앱 셸/온보딩용 뷰어 — 실제 로그인 유저 반영(하드코딩 제거) + 역할선택 필요 여부.
export interface Viewer {
  loggedIn: boolean;
  name: string | null;
  onboarded: boolean;
  role: string;
  stale?: boolean; // 토큰이 삭제된 계정을 가리킴 → 재로그인 필요
}
export async function getViewer(): Promise<Viewer> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id || !/^[0-9a-f-]{36}$/.test(id))
    return { loggedIn: false, name: null, onboarded: true, role: "company" };
  try {
    const db = getDb();
    const [u] = await db
      .select({
        name: schema.users.name,
        onboarded: schema.users.onboarded,
        role: schema.users.role,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    if (!u)
      // 유령 세션 — 행이 없음. 배너로 재로그인 유도.
      return {
        loggedIn: true,
        name: session.user?.name ?? null,
        onboarded: true,
        role: "company",
        stale: true,
      };
    return { loggedIn: true, name: u.name, onboarded: u.onboarded, role: u.role };
  } catch {
    return {
      loggedIn: true,
      name: session.user?.name ?? null,
      onboarded: true,
      role: "company",
    };
  }
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
