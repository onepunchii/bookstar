import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Vercel의 Neon 연동이 주입하는 DATABASE_URL 사용.
// 로컬에서는 `vercel env pull .env.local`로 받아온다.
export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL이 없습니다. Vercel 대시보드에서 Neon 연동 후 `vercel env pull .env.local`을 실행하세요."
    );
  }
  const sql = neon(url);
  return drizzle(sql, { schema });
}

export { schema };
