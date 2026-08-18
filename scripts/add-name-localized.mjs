// artists.name_localized (jsonb, nullable) 추가 — 소속사가 입력하는 로케일별 아티스트명.
// 실행: node --env-file=.env.local scripts/add-name-localized.mjs
// 안전: ADD COLUMN IF NOT EXISTS nullable jsonb → 테이블 리라이트/락 없음, 기존 데이터 불변.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL 없음. `vercel env pull .env.local` 후 --env-file=.env.local 로 실행.");
  process.exit(1);
}
const sql = neon(url);

const before = await sql`
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'artists' AND column_name = 'name_localized'`;
if (before.length) {
  console.log("이미 존재: artists.name_localized — 스킵.");
} else {
  await sql`ALTER TABLE artists ADD COLUMN IF NOT EXISTS name_localized jsonb`;
  console.log("추가 완료: artists.name_localized jsonb");
}

const after = await sql`
  SELECT column_name, data_type, is_nullable FROM information_schema.columns
  WHERE table_name = 'artists' AND column_name = 'name_localized'`;
console.log("검증:", JSON.stringify(after[0] ?? null));
const cnt = await sql`SELECT count(*)::int AS n FROM artists`;
console.log("artists 행 수(불변 확인):", cnt[0].n);
