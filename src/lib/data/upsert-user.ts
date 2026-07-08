// 카카오 로그인 유저 upsert — auth 미의존(순환 참조 방지). auth.ts의 jwt 콜백에서 호출.
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// 관리자 카카오 ID 허용목록(env, 콤마 구분). 여기 든 계정은 role=admin으로 고정.
function adminKakaoIds(): string[] {
  return (process.env.ADMIN_KAKAO_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function upsertKakaoUser(
  kakaoId: string,
  name: string
): Promise<{ id: string; role: string }> {
  const db = getDb();
  const isAdmin = adminKakaoIds().includes(kakaoId);

  const [existing] = await db
    .select({ id: schema.users.id, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.kakaoId, kakaoId))
    .limit(1);

  if (existing) {
    // 허용목록에 있는데 아직 admin이 아니면 승격(재로그인 시 반영)
    if (isAdmin && existing.role !== "admin") {
      await db
        .update(schema.users)
        .set({ role: "admin" })
        .where(eq(schema.users.id, existing.id));
      return { id: existing.id, role: "admin" };
    }
    return existing;
  }

  const [created] = await db
    .insert(schema.users)
    .values({ kakaoId, name, role: isAdmin ? "admin" : "company" })
    .returning({ id: schema.users.id, role: schema.users.role });
  return created;
}
