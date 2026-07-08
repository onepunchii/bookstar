import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import type { BookingStatus } from "@/lib/types";

// 섭외 요청 상태 변경 — 소속사 콘솔(인증 필수).
// 수락/거절/협의 등 상태를 booking_requests에 반영하고 감사 로그를 남긴다.
interface Body {
  id: string;
  status: BookingStatus;
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  try {
    const { id, status } = (await req.json()) as Body;
    if (!id || !status)
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

    const db = getDb();
    const [before] = await db
      .select({ status: schema.bookingRequests.status })
      .from(schema.bookingRequests)
      .where(eq(schema.bookingRequests.id, id))
      .limit(1);
    if (!before)
      return NextResponse.json({ error: "없는 요청" }, { status: 404 });

    await db
      .update(schema.bookingRequests)
      .set({ status })
      .where(eq(schema.bookingRequests.id, id));

    // 상태 변경 감사 로그 (분쟁 대비)
    await db.insert(schema.bookingStatusHistory).values({
      requestId: id,
      fromStatus: before.status,
      toStatus: status,
    });

    revalidatePath("/agency/inbox");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[booking status]", e);
    return NextResponse.json({ error: "상태 변경 실패" }, { status: 500 });
  }
}
