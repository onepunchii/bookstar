// 견적 읽기 레이어 — Neon quotes.
import { desc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";

export interface QuoteView {
  id: string;
  requestId: string;
  amount: number;
  includes: string | null;
  note: string | null;
  accepted: boolean;
}

/** 요청의 최신 견적 */
export async function getLatestQuote(
  requestId: string
): Promise<QuoteView | null> {
  try {
    const db = getDb();
    const [q] = await db
      .select()
      .from(schema.quotes)
      .where(eq(schema.quotes.requestId, requestId))
      .orderBy(desc(schema.quotes.createdAt))
      .limit(1);
    if (!q) return null;
    return {
      id: q.id,
      requestId: q.requestId,
      amount: q.amount,
      includes: q.includes,
      note: q.note,
      accepted: q.accepted,
    };
  } catch {
    return null;
  }
}

/** 요청별 최신 견적 맵 — 인박스 초기 상태용 */
export async function getLatestQuotesMap(): Promise<
  Record<string, QuoteView>
> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.quotes)
      .orderBy(desc(schema.quotes.createdAt));
    const map: Record<string, QuoteView> = {};
    for (const q of rows) {
      if (!map[q.requestId]) {
        map[q.requestId] = {
          id: q.id,
          requestId: q.requestId,
          amount: q.amount,
          includes: q.includes,
          note: q.note,
          accepted: q.accepted,
        };
      }
    }
    return map;
  } catch {
    return {};
  }
}
