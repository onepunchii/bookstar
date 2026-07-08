import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { notify } from "@/lib/data/notify";

// 견적 회신 — quotes 저장 + 협의 메시지 생성 + 요청 상태 negotiating 전환.
// 소속사 인박스의 '견적 보내기'가 광고주 협의 채팅·요청 상세에 실제로 나타난다.
interface Body {
  requestId: string;
  amount: number;
  includes?: string;
  note?: string;
  senderName?: string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  try {
    const b = (await req.json()) as Body;
    if (!b.requestId || !b.amount || b.amount <= 0) {
      return NextResponse.json({ error: "잘못된 견적" }, { status: 400 });
    }
    const db = getDb();
    const [request] = await db
      .select({
        status: schema.bookingRequests.status,
        companyUserId: schema.bookingRequests.companyUserId,
      })
      .from(schema.bookingRequests)
      .where(eq(schema.bookingRequests.id, b.requestId))
      .limit(1);
    if (!request) {
      return NextResponse.json({ error: "없는 요청" }, { status: 404 });
    }

    // 1) 견적 저장
    const [quote] = await db
      .insert(schema.quotes)
      .values({
        requestId: b.requestId,
        amount: b.amount,
        includes: b.includes || null,
        note: b.note || null,
      })
      .returning({ id: schema.quotes.id });

    // 2) 협의 채팅에 견적 메시지
    const body = [
      `견적을 보냈어요 — 총 ${b.amount.toLocaleString()}만원`,
      b.includes ? `포함: ${b.includes}` : null,
      b.note ? `메모: ${b.note}` : null,
    ]
      .filter(Boolean)
      .join("\n");
    await db.insert(schema.messages).values({
      requestId: b.requestId,
      sender: "agency",
      senderName: b.senderName || "소속사 담당자",
      body,
    });

    // 3) 상태 → 협의 중 (+감사 로그)
    if (request.status !== "negotiating") {
      await db
        .update(schema.bookingRequests)
        .set({ status: "negotiating" })
        .where(eq(schema.bookingRequests.id, b.requestId));
      await db.insert(schema.bookingStatusHistory).values({
        requestId: b.requestId,
        fromStatus: request.status,
        toStatus: "negotiating",
      });
    }

    // 광고주에게 견적 도착 알림
    await notify(request.companyUserId, {
      type: "quote_received",
      title: "새 견적이 도착했어요",
      body: `총 ${b.amount.toLocaleString()}만원${b.includes ? ` · ${b.includes}` : ""}`,
      link: `/requests/${b.requestId}`,
    });

    revalidatePath("/agency/inbox");
    revalidatePath(`/requests/${b.requestId}`);
    revalidatePath("/requests");
    return NextResponse.json({ ok: true, id: quote.id });
  } catch (e) {
    console.error("[quote send]", e);
    return NextResponse.json({ error: "견적 전송 실패" }, { status: 500 });
  }
}

// 요청별 최신 견적 조회 (광고주 상세)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requestId = searchParams.get("requestId");
  if (!requestId) {
    return NextResponse.json({ error: "requestId 필요" }, { status: 400 });
  }
  try {
    const db = getDb();
    const [quote] = await db
      .select()
      .from(schema.quotes)
      .where(eq(schema.quotes.requestId, requestId))
      .orderBy(desc(schema.quotes.createdAt))
      .limit(1);
    return NextResponse.json({ quote: quote ?? null });
  } catch {
    return NextResponse.json({ quote: null });
  }
}
