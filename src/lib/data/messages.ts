// 협의 스레드 읽기 레이어 — Neon messages → ThreadMessage.
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { ThreadMessage } from "@/lib/types";

const SENDER_LABEL: Record<string, string> = {
  company: "광고주",
  agency: "소속사",
  system: "xong",
};

/** 요청별 마지막 메시지 발신자 — '새 답장' 배지용 (읽음 테이블 전 단계 프록시) */
export async function getLastSenderMap(): Promise<Record<string, string>> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        requestId: schema.messages.requestId,
        sender: schema.messages.sender,
        createdAt: schema.messages.createdAt,
      })
      .from(schema.messages)
      .orderBy(asc(schema.messages.createdAt));
    const map: Record<string, string> = {};
    for (const r of rows) map[r.requestId] = r.sender; // 시간순 → 마지막이 남음
    return map;
  } catch {
    return {};
  }
}

export async function getMessages(requestId: string): Promise<ThreadMessage[]> {
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.messages)
      .where(eq(schema.messages.requestId, requestId))
      .orderBy(asc(schema.messages.createdAt));
    return rows.map((r) => ({
      id: r.id,
      requestId: r.requestId,
      sender: r.sender,
      senderName: r.senderName ?? SENDER_LABEL[r.sender] ?? "",
      body: r.body,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch {
    return [];
  }
}
