import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getSessionUser, getSessionAgency } from "@/lib/data/session";
import { agencyOwnsArtist } from "@/lib/data/ownership";
import { agencyUserForArtist, notify } from "@/lib/data/notify";

// 협의 메시지 전송 — 요청 당사자(광고주 본인 또는 담당 소속사)만.
// 발신자(sender)는 세션에서 도출한다(클라이언트 값 신뢰 금지 — 사칭 방어).
interface Body {
  requestId: string;
  body: string;
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  try {
    const b = (await req.json()) as Body;
    if (!b.requestId || !b.body?.trim()) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }

    const db = getDb();
    const [request] = await db
      .select({
        companyUserId: schema.bookingRequests.companyUserId,
        artistId: schema.bookingRequests.artistId,
      })
      .from(schema.bookingRequests)
      .where(eq(schema.bookingRequests.id, b.requestId))
      .limit(1);
    if (!request) {
      return NextResponse.json({ error: "없는 요청" }, { status: 404 });
    }

    // 발신자 판별: 광고주 본인 or 담당 소속사. 둘 다 아니면 접근 불가.
    let sender: "company" | "agency";
    let senderName: string;
    if (request.companyUserId === user.id) {
      sender = "company";
      senderName = user.name || "광고주";
    } else {
      const agency = await getSessionAgency();
      if (agency && (await agencyOwnsArtist(agency.id, request.artistId))) {
        sender = "agency";
        senderName = agency.companyName || "소속사 담당자";
      } else {
        return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
      }
    }

    const [row] = await db
      .insert(schema.messages)
      .values({
        requestId: b.requestId,
        sender,
        senderUserId: user.id,
        senderName,
        body: b.body.trim(),
      })
      .returning({
        id: schema.messages.id,
        createdAt: schema.messages.createdAt,
      });

    // 상대방에게 새 메시지 알림
    try {
      const recipient =
        sender === "company"
          ? await agencyUserForArtist(request.artistId)
          : request.companyUserId;
      await notify(recipient, {
        type: "message",
        title: sender === "company" ? "광고주 새 메시지" : "소속사 새 메시지",
        body: b.body.trim().slice(0, 60),
        link: `/requests/${b.requestId}`,
      });
    } catch {
      /* 알림 실패해도 전송은 유지 */
    }

    revalidatePath(`/requests/${b.requestId}`);
    return NextResponse.json({
      ok: true,
      id: row.id,
      sender,
      senderName,
      createdAt: row.createdAt.toISOString(),
    });
  } catch (e) {
    console.error("[message send]", e);
    return NextResponse.json({ error: "전송 실패" }, { status: 500 });
  }
}
