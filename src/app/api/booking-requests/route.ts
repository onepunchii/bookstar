import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { agencyUserForArtist, notify } from "@/lib/data/notify";
import type { BookingStatus } from "@/lib/types";

// 광고주 섭외 요청 생성 (미인증 공개 — 광고주측 로그인 전).
interface CreateBody {
  artistId: string;
  companyName?: string;
  companyVerified?: boolean;
  companyEventCount?: number;
  eventType: string;
  budget: number;
  location?: string;
  eventDate?: string;
  message?: string;
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as CreateBody;
    if (!b.artistId || !b.eventType) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }
    const db = getDb();
    // 데모: 시드된 광고주 유저를 요청자로 사용
    const [companyUser] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.role, "company"))
      .limit(1);
    if (!companyUser) {
      return NextResponse.json({ error: "광고주 계정 없음" }, { status: 400 });
    }
    const [row] = await db
      .insert(schema.bookingRequests)
      .values({
        companyUserId: companyUser.id,
        artistId: b.artistId,
        companyName: b.companyName || null,
        companyVerified: b.companyVerified ?? false,
        companyEventCount: b.companyEventCount ?? null,
        eventType: b.eventType,
        budget: b.budget,
        location: b.location || null,
        eventDate: b.eventDate || null,
        message: b.message || null,
        status: "pending",
      })
      .returning({ id: schema.bookingRequests.id });

    // 소속사에 새 요청 알림
    const [artist] = await db
      .select({ name: schema.artists.name })
      .from(schema.artists)
      .where(eq(schema.artists.id, b.artistId))
      .limit(1);
    await notify(await agencyUserForArtist(b.artistId), {
      type: "new_request",
      title: "새 섭외 요청",
      body: `${artist?.name ?? "아티스트"} · ${b.eventType} · 예산 ${b.budget.toLocaleString()}만원`,
      link: "/agency/inbox",
    });

    revalidatePath("/agency/inbox");
    revalidatePath("/requests");
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("[booking create]", e);
    return NextResponse.json({ error: "요청 실패" }, { status: 500 });
  }
}

// 섭외 요청 상태 변경 — 소속사 콘솔(인증 필수).
// 수락/거절/협의 등 상태를 booking_requests에 반영하고 감사 로그를 남긴다.
interface Body {
  id: string;
  status?: BookingStatus;
  advancingChecked?: string[]; // 어드밴싱 체크리스트 저장
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user)
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  try {
    const { id, status, advancingChecked } = (await req.json()) as Body;
    if (!id || (!status && !advancingChecked))
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

    const db = getDb();
    const [before] = await db
      .select({
        status: schema.bookingRequests.status,
        companyUserId: schema.bookingRequests.companyUserId,
        artistId: schema.bookingRequests.artistId,
      })
      .from(schema.bookingRequests)
      .where(eq(schema.bookingRequests.id, id))
      .limit(1);
    if (!before)
      return NextResponse.json({ error: "없는 요청" }, { status: 404 });

    // 체크리스트만 저장하는 경우
    if (advancingChecked) {
      await db
        .update(schema.bookingRequests)
        .set({ advancing: advancingChecked })
        .where(eq(schema.bookingRequests.id, id));
      if (!status) return NextResponse.json({ ok: true });
    }
    if (!status) return NextResponse.json({ ok: true });

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

    // 수락/거절 시 광고주에게 알림
    if (status === "accepted" || status === "rejected") {
      const [artist] = await db
        .select({ name: schema.artists.name })
        .from(schema.artists)
        .where(eq(schema.artists.id, before.artistId))
        .limit(1);
      await notify(before.companyUserId, {
        type: status === "accepted" ? "booking_accepted" : "new_request",
        title:
          status === "accepted"
            ? "섭외 요청이 수락됐어요"
            : "섭외 요청이 거절됐어요",
        body: `${artist?.name ?? "아티스트"} · 협의 채팅에서 확인하세요`,
        link: `/requests/${id}`,
      });
    }

    revalidatePath("/agency/inbox");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[booking status]", e);
    return NextResponse.json({ error: "상태 변경 실패" }, { status: 500 });
  }
}
