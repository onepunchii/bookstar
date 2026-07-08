// 알림 생성 헬퍼 — 서버 API들이 이벤트 발생 시 notifications에 기록.
// 수신자 해석: 실계정 우선, 데모는 시드 역할 유저로 폴백.
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function notify(
  userId: string | null | undefined,
  n: { type: string; title: string; body?: string; link?: string }
): Promise<void> {
  if (!userId) return;
  try {
    const db = getDb();
    await db.insert(schema.notifications).values({
      userId,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
    });
  } catch (e) {
    console.error("[notify]", e);
  }
}

/** 역할별 데모 수신 유저 (시드) */
export async function demoUserForRole(
  role: "company" | "agency" | "artist"
): Promise<string | null> {
  try {
    const db = getDb();
    const [u] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.role, role))
      .limit(1);
    return u?.id ?? null;
  } catch {
    return null;
  }
}

/** 아티스트의 소속사 수신 유저 — 소유자 있으면 소유자, 없으면 시드 agency */
export async function agencyUserForArtist(
  artistId: string
): Promise<string | null> {
  try {
    const db = getDb();
    const [row] = await db
      .select({ ownerId: schema.agencies.ownerId })
      .from(schema.artists)
      .leftJoin(schema.agencies, eq(schema.artists.agencyId, schema.agencies.id))
      .where(eq(schema.artists.id, artistId))
      .limit(1);
    if (row?.ownerId) return row.ownerId;
  } catch {
    /* 폴백 */
  }
  return demoUserForRole("agency");
}
