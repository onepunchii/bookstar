// 허위(시드) 데이터 일괄 제거 — 실존 소속사명·실존 아티스트명을 쓴 목데이터가
// 프로덕션 DB에 시드돼 공개 검색에 노출되던 문제 정리.
//
// 실행: node --env-file=.env.local scripts/purge-seed-data.mjs         (드라이런: 세는 것만)
//       node --env-file=.env.local scripts/purge-seed-data.mjs --apply (실제 삭제)
//
// 삭제 대상
//  - 시드 아티스트 8명(lisenne/qwer/kimseoyeon/parkdohyun/haneul/leejunho/mina/taeyoon)과 그 참조 데이터
//  - 시드 유저 2명: 이대리(buyer@brightmk.co.kr, 광고주) / 박세진(manager@starone.co.kr, 소속사)
//  - 위 유저가 만든 데이터(섭외요청·메시지·정산 등)
// 보존: 실제 가입 유저·그들의 소속사/아티스트. 스타원엔터테인먼트는 소유자만 정리하고
//       실제 등록물이 남아있으면 소속사 자체는 유지(연쇄 삭제 방지).

import { neon } from "@neondatabase/serverless";

const APPLY = process.argv.includes("--apply");
const sql = neon(process.env.DATABASE_URL);

const SEED_SLUGS = [
  "lisenne", "qwer", "kimseoyeon", "parkdohyun",
  "haneul", "leejunho", "mina", "taeyoon",
];
const SEED_EMAILS = ["buyer@brightmk.co.kr", "manager@starone.co.kr"];

const artists = await sql`SELECT id, slug, name FROM artists WHERE slug = ANY(${SEED_SLUGS})`;
const artistIds = artists.map((r) => r.id);
const users = await sql`SELECT id, name, email FROM users WHERE email = ANY(${SEED_EMAILS})`;
const userIds = users.map((r) => r.id);

console.log(`대상 아티스트 ${artists.length}명: ${artists.map((a) => a.name).join(", ")}`);
console.log(`대상 유저 ${users.length}명: ${users.map((u) => u.name + "(" + u.email + ")").join(", ")}`);
console.log(`모드: ${APPLY ? "🔴 실제 삭제(--apply)" : "🟡 드라이런(카운트만)"}\n`);

// 삭제할 booking_request id (시드 아티스트 대상 + 시드 유저가 보낸 것)
const reqRows = await sql.query(
  `SELECT id FROM booking_requests WHERE artist_id = ANY($1) OR company_user_id = ANY($2)`,
  [artistIds, userIds]
);
const reqIds = reqRows.map((r) => r.id);

// (테이블, WHERE, 파라미터) — 자식 → 부모 순서
const STEPS = [
  ["booking_status_history", "request_id = ANY($1)", [reqIds]],
  ["messages", "request_id = ANY($1)", [reqIds]],
  ["quotes", "request_id = ANY($1)", [reqIds]],
  ["documents", "request_id = ANY($1) OR artist_id = ANY($2)", [reqIds, artistIds]],
  ["holds", "request_id = ANY($1)", [reqIds]],
  ["settlements", "artist_id = ANY($1)", [artistIds]],
  ["campaign_applications", "artist_id = ANY($1)", [artistIds]],
  ["day_schedules", "artist_id = ANY($1)", [artistIds]],
  ["schedules", "artist_id = ANY($1)", [artistIds]],
  ["holds", "artist_id = ANY($1)", [artistIds]],
  ["leaves", "artist_id = ANY($1)", [artistIds]],
  ["booking_requests", "id = ANY($1)", [reqIds]],
  ["artists", "id = ANY($1)", [artistIds]],
  // 시드 유저가 남긴 잔여물
  ["notifications", "user_id = ANY($1)", [userIds]],
  ["campaigns", "company_user_id = ANY($1)", [userIds]],
  ["feedbacks", "user_id = ANY($1)", [userIds]],
  ["content_reports", "reporter_user_id = ANY($1)", [userIds]],
  ["blocked_users", "user_id = ANY($1) OR blocked_user_id = ANY($1)", [userIds]],
  ["accounts", "user_id = ANY($1)", [userIds]],
  ["sessions", "user_id = ANY($1)", [userIds]],
];

// 시드 소속사(박세진 소유)에 걸린 가공 문서·매니저 등 — 이름이 시드 아티스트를 참조하는 허위 자료
const seedAgencies = await sql`SELECT id, company_name FROM agencies WHERE owner_id = ANY(${userIds})`;
const seedAgencyIds = seedAgencies.map((r) => r.id);
if (seedAgencyIds.length) {
  STEPS.push(
    ["documents", "agency_id = ANY($1)", [seedAgencyIds]],
    ["managers", "agency_id = ANY($1)", [seedAgencyIds]],
    ["bundles", "agency_id = ANY($1)", [seedAgencyIds]],
    ["campaigns", "agency_id = ANY($1)", [seedAgencyIds]]
  );
}

for (const [table, where, params] of STEPS) {
  try {
    const cnt = await sql.query(`SELECT count(*)::int n FROM ${table} WHERE ${where}`, params);
    const n = cnt[0].n;
    if (n === 0) { console.log(`  ${table.padEnd(24)} 0건 — 스킵`); continue; }
    if (APPLY) {
      await sql.query(`DELETE FROM ${table} WHERE ${where}`, params);
      console.log(`  ${table.padEnd(24)} ${n}건 삭제 ✓`);
    } else {
      console.log(`  ${table.padEnd(24)} ${n}건 (삭제 예정)`);
    }
  } catch (e) {
    console.log(`  ${table.padEnd(24)} ⚠ ${e.message.slice(0, 70)}`);
  }
}

// 시드 유저: 소속사 소유자로 걸려 있으면 먼저 분리
if (APPLY) {
  for (const uid of userIds) {
    const owned = await sql`SELECT id, company_name FROM agencies WHERE owner_id = ${uid}`;
    for (const ag of owned) {
      const left = await sql`SELECT count(*)::int n FROM artists WHERE agency_id = ${ag.id}`;
      if (left[0].n === 0) {
        await sql`DELETE FROM agencies WHERE id = ${ag.id}`;
        console.log(`  agencies                 "${ag.company_name}" 삭제 ✓ (소속 아티스트 0)`);
      } else {
        await sql`UPDATE agencies SET owner_id = NULL WHERE id = ${ag.id}`;
        console.log(`  agencies                 "${ag.company_name}" 소유자 해제(아티스트 ${left[0].n}명 남음)`);
      }
    }
  }
  // 유저를 참조하는 잔여 FK를 먼저 정리(남은 섭외요청이 있으면 삭제 불가하므로 확인)
  const stillRef = await sql.query(
    `SELECT count(*)::int n FROM booking_requests WHERE company_user_id = ANY($1)`,
    [userIds]
  );
  if (stillRef[0].n > 0) {
    console.log(`  users                    ⚠ 스킵 — booking_requests ${stillRef[0].n}건이 아직 참조 중`);
  } else {
    const du = await sql`DELETE FROM users WHERE id = ANY(${userIds}) RETURNING name`;
    console.log(`  users                    ${du.length}건 삭제 ✓`);
  }
} else {
  console.log(`  agencies/users           (--apply 시 처리)`);
}

console.log("\n═══ 잔여 상태 ═══");
const ra = await sql`SELECT slug, name, agency_name FROM artists ORDER BY created_at`;
console.log(`artists ${ra.length}행:`);
ra.forEach((r) => console.log(`  ${String(r.slug).padEnd(22)}${r.name} | ${r.agency_name ?? "-"}`));
const ru = await sql`SELECT name, role FROM users ORDER BY created_at`;
console.log(`users ${ru.length}행: ${ru.map((u) => u.name + "(" + u.role + ")").join(", ")}`);
const rb = await sql`SELECT count(*)::int n FROM booking_requests`;
console.log(`booking_requests ${rb[0].n}행`);
