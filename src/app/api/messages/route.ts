import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";

// 협의 메시지 전송 — 광고주·소속사 양측. (광고주측은 아직 미인증이라 공개)
interface Body {
  requestId: string;
  sender: "company" | "agency" | "system";
  senderName?: string;
  body: string;
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body;
    if (!b.requestId || !b.body?.trim() || !b.sender) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }
    const db = getDb();
    const [row] = await db
      .insert(schema.messages)
      .values({
        requestId: b.requestId,
        sender: b.sender,
        senderName: b.senderName ?? null,
        body: b.body.trim(),
      })
      .returning({ id: schema.messages.id, createdAt: schema.messages.createdAt });
    return NextResponse.json({
      ok: true,
      id: row.id,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("[message send]", e);
    return NextResponse.json({ error: "전송 실패" }, { status: 500 });
  }
}
