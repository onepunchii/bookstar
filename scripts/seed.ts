/**
 * Neon 시드 스크립트 — 목데이터를 실제 DB로 이전한다.
 * 실행: npm run db:seed  (DATABASE_URL 필요 — .env.local에서 자동 로드)
 */
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import {
  ARTISTS,
  BOOKING_REQUESTS,
  DAY_SCHEDULES,
  DOCUMENTS,
  MANAGERS,
  SCHEDULES,
  SETTLEMENTS,
} from "../src/lib/mock-data";

// .env.local 수동 로드 (dotenv 의존성 없이)
if (!process.env.DATABASE_URL) {
  try {
    for (const line of readFileSync(".env.local", "utf8").split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?([^"'\n]*)["']?$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
    }
  } catch {
    /* .env.local 없음 */
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL이 없습니다. `vercel env pull .env.local` 후 다시 실행하세요."
  );
  process.exit(1);
}

const db = drizzle(neon(url), { schema });

async function main() {
  console.log("시드 시작…");

  // 1) 유저 & 소속사
  const [companyUser] = await db
    .insert(schema.users)
    .values({
      email: "buyer@brightmk.co.kr",
      role: "company",
      name: "이대리",
      company: "(주)브라이트마케팅",
    })
    .returning();

  const [agencyUser] = await db
    .insert(schema.users)
    .values({
      email: "manager@starone.co.kr",
      role: "agency",
      name: "박세진",
      company: "스타원엔터테인먼트",
    })
    .returning();

  const [agency] = await db
    .insert(schema.agencies)
    .values({
      ownerId: agencyUser.id,
      companyName: "스타원엔터테인먼트",
      manager: "박세진",
      email: "manager@starone.co.kr",
      verified: true,
    })
    .returning();

  // 2) 아티스트 (mock id → uuid 매핑)
  const artistIdMap = new Map<string, string>();
  for (const a of ARTISTS) {
    const [row] = await db
      .insert(schema.artists)
      .values({
        agencyId: agency.id,
        name: a.name,
        groupName: a.groupName,
        categories: a.categories,
        gender: a.gender,
        tagline: a.tagline,
        followers: a.followers,
        responseRate: a.responseRate,
        responseHours: a.responseHours,
        budgetMin: a.budgetRange[0],
        budgetMax: a.budgetRange[1],
        tags: a.tags,
        recentWork: a.recentWork,
        presetFee: a.quotePreset?.baseFee,
        presetIncludes: a.quotePreset?.includes,
        presetNote: a.quotePreset?.note,
        verified: a.verified,
      })
      .returning();
    artistIdMap.set(a.id, row.id);
  }
  console.log(`아티스트 ${artistIdMap.size}팀`);

  // 3) 7월 일정
  let scheduleCount = 0;
  for (const [mockId, days] of Object.entries(SCHEDULES)) {
    const artistId = artistIdMap.get(mockId)!;
    for (const day of days) {
      await db.insert(schema.schedules).values({
        artistId,
        date: day.date,
        availability: day.availability,
        publicNote: day.note,
      });
      scheduleCount++;
    }
  }
  console.log(`일정 ${scheduleCount}건`);

  // 4) 섭외 요청
  const requestIdMap = new Map<string, string>();
  for (const r of BOOKING_REQUESTS) {
    const [row] = await db
      .insert(schema.bookingRequests)
      .values({
        companyUserId: companyUser.id,
        artistId: artistIdMap.get(r.artistId)!,
        eventType: r.eventType,
        budget: r.budget,
        location: r.location,
        eventDate: r.date,
        message: r.message,
        status: r.status,
      })
      .returning();
    requestIdMap.set(r.id, row.id);
  }
  console.log(`섭외 요청 ${requestIdMap.size}건`);

  // 5) 홀드 (정하늘 7/24 — r1)
  await db.insert(schema.holds).values({
    artistId: artistIdMap.get("a5")!,
    date: "2026-07-24",
    requestId: requestIdMap.get("r1"),
    companyName: "(주)브라이트마케팅",
    expiresAt: "2026-07-10",
  });

  // 6) 데일리 스케줄
  for (const d of DAY_SCHEDULES) {
    await db.insert(schema.daySchedules).values({
      artistId: artistIdMap.get(d.artistId)!,
      date: d.date,
      title: d.title,
      eventType: d.eventType,
      manager: d.manager,
      vehicle: d.vehicle,
      stops: d.stops,
      memo: d.memo,
    });
  }
  console.log(`데일리 스케줄 ${DAY_SCHEDULES.length}건`);

  // 7) 휴가
  await db.insert(schema.leaves).values([
    {
      artistId: artistIdMap.get("a5")!,
      startDate: "2026-07-20",
      endDate: "2026-07-21",
      reason: "가족 행사",
      status: "pending",
    },
    {
      artistId: artistIdMap.get("a1")!,
      startDate: "2026-07-13",
      endDate: "2026-07-13",
      reason: "멤버 건강검진",
      status: "approved",
    },
  ]);

  // 8) 정산
  for (const s of SETTLEMENTS) {
    await db.insert(schema.settlements).values({
      artistId: artistIdMap.get(s.artistId)!,
      eventTitle: s.eventTitle,
      eventDate: s.date,
      gross: s.gross,
      agencyRateBp: Math.round(s.agencyRate * 10000),
      status: s.status,
      taxInvoice: s.taxInvoice,
    });
  }
  console.log(`정산 ${SETTLEMENTS.length}건`);

  // 9) 서류함
  for (const doc of DOCUMENTS) {
    await db.insert(schema.documents).values({
      agencyId: agency.id,
      name: doc.name,
      type: doc.type,
      eventTitle: doc.eventTitle,
    });
  }

  // 10) 매니저
  for (const m of MANAGERS) {
    await db.insert(schema.managers).values({
      agencyId: agency.id,
      name: m.name,
      role: m.role,
      phone: m.phone,
      artistIds: m.artistIds
        .map((id) => artistIdMap.get(id))
        .filter(Boolean) as string[],
    });
  }
  console.log(`매니저 ${MANAGERS.length}명`);

  console.log("시드 완료 ✅");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
