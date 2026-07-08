// 카카오 로그인 유저 upsert — auth 미의존(순환 참조 방지). auth.ts의 jwt 콜백에서 호출.
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export async function upsertKakaoUser(
  kakaoId: string,
  name: string
): Promise<{ id: string; role: string }> {
  const db = getDb();
  const [existing] = await db
    .select({ id: schema.users.id, role: schema.users.role })
    .from(schema.users)
    .where(eq(schema.users.kakaoId, kakaoId))
    .limit(1);
  if (existing) return existing;
  const [created] = await db
    .insert(schema.users)
    .values({ kakaoId, name, role: "company" })
    .returning({ id: schema.users.id, role: schema.users.role });
  return created;
}
