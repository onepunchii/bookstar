// 협의 스레드 읽기 레이어 — Neon messages → ThreadMessage.
import { asc, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import type { ThreadMessage } from "@/lib/types";

const SENDER_LABEL: Record<string, string> = {
  company: "광고주",
  agency: "소속사",
  system: "xong",
};

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
