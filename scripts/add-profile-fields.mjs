// 아티스트 프로필 확장 필드 — 1단계 코어 컬럼.
// 실행: node --env-file=.env.local scripts/add-profile-fields.mjs
// 안전: 전부 ADD COLUMN IF NOT EXISTS + nullable(또는 jsonb 기본값) → 테이블 리라이트/락 없음.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL 없음. --env-file=.env.local 로 실행하세요.");
  process.exit(1);
}
const sql = neon(url);

// [컬럼명, 타입, 설명]
const COLUMNS = [
  ["birth_year", "integer", "출생년도(연도만 — 월·일 미저장)"],
  ["career_start_year", "integer", "활동 시작 연도"],
  ["active_regions", "jsonb", "활동 지역(최대 3)"],
  ["height_cm", "integer", "신장"],
  ["weight_kg", "integer", "체중(기본 비공개)"],
  ["skills", "jsonb", "특기 [{name, level}]"],
  ["credits", "jsonb", "활동 이력 [{type, year, title, role, highlighted}]"],
  ["videos", "jsonb", "대표 영상 [{url, title}]"],
  ["links", "jsonb", "외부 링크 [{type, url}]"],
  ["languages", "jsonb", "가능 언어 [{lang, level}]"],
  ["accepted_event_types", "jsonb", "가능한 섭외 유형"],
  ["min_lead_days", "integer", "최소 리드타임(일)"],
  ["field_visibility", "jsonb", "항목별 공개 범위 {height:'public'|'members'|'private', ...}"],
  ["profile_extras", "jsonb", "카테고리별 확장 블록(장르·진행유형·강연주제·채널지표 등)"],
];

let added = 0;
for (const [name, type, desc] of COLUMNS) {
  const exists = await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'artists' AND column_name = ${name}`;
  if (exists.length) {
    console.log(`  = ${name.padEnd(22)} 이미 존재 — 스킵`);
    continue;
  }
  await sql.query(`ALTER TABLE artists ADD COLUMN IF NOT EXISTS ${name} ${type}`);
  console.log(`  + ${name.padEnd(22)} ${type.padEnd(8)} ${desc}`);
  added++;
}

console.log(`\n추가 ${added}개 / 전체 ${COLUMNS.length}개`);

const cols = await sql`
  SELECT column_name, data_type FROM information_schema.columns
  WHERE table_name = 'artists' ORDER BY ordinal_position`;
console.log(`artists 컬럼 총 ${cols.length}개`);
const n = await sql`SELECT count(*)::int AS n FROM artists`;
console.log(`행 수(불변 확인): ${n[0].n}`);
