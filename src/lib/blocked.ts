import { and, eq, or } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// 차단 관계 조회 헬퍼 — App Store 1.2 UGC (onp 검증 패턴).
// 실패(테이블 부재 등) 시 안전한 폴백: 차단 기능 오류가 본 기능을 죽이면 안 됨.

// 내가 차단한 사용자 id 목록 — 목록/조회 쿼리에서 제외하는 데 사용.
export async function blockedIds(
  userId: string | null | undefined
): Promise<string[]> {
  if (!userId) return [];
  try {
    const db = getDb();
    const rows = await db
      .select({ id: schema.blockedUsers.blockedId })
      .from(schema.blockedUsers)
      .where(eq(schema.blockedUsers.blockerId, userId));
    return rows.map((r) => r.id);
  } catch {
    return [];
  }
}

// 두 사용자 사이에 차단 관계가 있는지 (어느 방향이든) — 협의 채팅 전송 차단용.
export async function isBlockedEither(a: string, b: string): Promise<boolean> {
  try {
    const db = getDb();
    const rows = await db
      .select({ blocker: schema.blockedUsers.blockerId })
      .from(schema.blockedUsers)
      .where(
        or(
          and(
            eq(schema.blockedUsers.blockerId, a),
            eq(schema.blockedUsers.blockedId, b)
          ),
          and(
            eq(schema.blockedUsers.blockerId, b),
            eq(schema.blockedUsers.blockedId, a)
          )
        )
      )
      .limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}
