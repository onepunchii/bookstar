import { sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

// 일별 유니크 접속자 집계 — 스키마는 src/lib/db/schema.ts 의 dailyVisits 참고.
//
// 가입자 수는 "얼마나 남았나"를, 접속자 수는 "얼마나 오나"를 말해 준다. 둘은 다른 질문이고
// 슈퍼관리자 대시보드에는 둘 다 필요하다. (mapix 파일럿의 전역 확장.)

/** 방문자 ID 최대 길이. 클라이언트가 만든 난수(UUID)라 36자면 충분하지만 여유를 둔다. */
const MAX_VISITOR_LEN = 64;

/**
 * 오늘(KST) 이 방문자를 기록한다. 같은 날 같은 방문자는 PK 충돌로 무시된다(멱등).
 * @returns 기록했으면 true, 실패했으면 false — 호출부는 실패를 무시해도 된다(부가 기능).
 */
export async function recordVisit(visitor: string): Promise<boolean> {
  const v = visitor.trim();
  if (!v || v.length > MAX_VISITOR_LEN) return false;
  try {
    await getDb()
      .insert(schema.dailyVisits)
      .values({
        day: sql`(now() at time zone 'Asia/Seoul')::date`,
        visitor: v,
      })
      .onConflictDoNothing();
    return true;
  } catch {
    // 테이블이 아직 없거나 DB 가 잠깐 죽은 경우. 접속 집계 실패로 사용자 요청을 깨뜨리지 않는다.
    return false;
  }
}

export type VisitCounts = { today: number; yesterday: number } | null;

/**
 * 오늘·어제(KST) 유니크 접속자.
 *
 * ★ 실패하면 0 이 아니라 **null** 을 돌려준다. "접속자 0명"과 "집계가 아직 준비되지 않음"은
 *   전혀 다른 사실인데 0 으로 뭉개면 대시보드에서 구분할 수 없다. 마이그레이션을 아직
 *   적용하지 않은 DB 에서 "접속자 0" 을 보면 서비스가 죽은 줄로 오해한다.
 */
export async function visitCounts(): Promise<VisitCounts> {
  try {
    const day = schema.dailyVisits.day;
    const rows = await getDb()
      .select({
        today: sql<number>`count(*) filter (where ${day} = (now() at time zone 'Asia/Seoul')::date)::int`,
        yesterday: sql<number>`count(*) filter (where ${day} = (now() at time zone 'Asia/Seoul')::date - 1)::int`,
      })
      .from(schema.dailyVisits)
      .where(sql`${day} >= (now() at time zone 'Asia/Seoul')::date - 1`);
    return rows[0] ?? { today: 0, yesterday: 0 };
  } catch {
    return null;
  }
}
