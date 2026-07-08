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

// 로그인 유저가 소유한 소속사 (없으면 null → 데모)
export async function getSessionAgency(): Promise<{
  id: string;
  companyName: string;
} | null> {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) return null;
  try {
    const db = getDb();
    const [agency] = await db
      .select({
        id: schema.agencies.id,
        companyName: schema.agencies.companyName,
      })
      .from(schema.agencies)
      .where(eq(schema.agencies.ownerId, uid))
      .limit(1);
    return agency ?? null;
  } catch {
    return null;
  }
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
