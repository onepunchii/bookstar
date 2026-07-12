import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { agencyUserForArtist, notify } from "@/lib/data/notify";
import {
  getSessionUser,
  getSessionAgency,
  getSessionArtistId,
} from "@/lib/data/session";
import { agencyOwnsArtist } from "@/lib/data/ownership";

// 휴가 신청(아티스트 본인/담당 소속사) / 승인·거절(담당 소속사).
interface CreateBody {
  artistId: string;
  startDate: string;
  endDate: string;
  reason?: string;
}
interface DecideBody {
  id: string;
  status: "approved" | "rejected";
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user)
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  try {
    const b = (await req.json()) as CreateBody;
    if (!b.artistId || !b.startDate || !b.endDate) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }
    // 본인(연결된 아티스트) 또는 담당 소속사만 신청 가능
    const myArtistId = await getSessionArtistId();
    const agency = await getSessionAgency();
    const allowed =
      myArtistId === b.artistId ||
      (!!agency && (await agencyOwnsArtist(agency.id, b.artistId)));
    if (!allowed)
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    const db = getDb();
    const [row] = await db
      .insert(schema.leaves)
      .values({
        artistId: b.artistId,
        startDate: b.startDate,
        endDate: b.endDate,
        reason: b.reason || null,
        status: "pending",
      })
      .returning({ id: schema.leaves.id });

    // 소속사에 휴가 신청 알림
    const [artist] = await db
      .select({ name: schema.artists.name })
      .from(schema.artists)
      .where(eq(schema.artists.id, b.artistId))
      .limit(1);
    await notify(await agencyUserForArtist(b.artistId), {
      type: "leave_submitted",
      title: "휴가 신청",
      body: `${artist?.name ?? "아티스트"} · ${b.startDate}${b.endDate !== b.startDate ? ` ~ ${b.endDate}` : ""}${b.reason ? ` · ${b.reason}` : ""}`,
      link: "/agency/schedule",
    });

    revalidatePath("/agency/schedule");
    revalidatePath("/me");
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("[leave create]", e);
    return NextResponse.json({ error: "신청 실패" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const agency = await getSessionAgency();
  if (!agency)
    return NextResponse.json({ error: "소속사 인증이 필요합니다" }, { status: 401 });
  try {
    const b = (await req.json()) as DecideBody;
    if (!b.id || !b.status) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }
    const db = getDb();
    // 대상 휴가가 세션 소속사 소유 아티스트의 것인지 확인
    const [existing] = await db
      .select({ artistId: schema.leaves.artistId })
      .from(schema.leaves)
      .where(eq(schema.leaves.id, b.id))
      .limit(1);
    if (!existing)
      return NextResponse.json({ error: "없는 휴가" }, { status: 404 });
    if (!(await agencyOwnsArtist(agency.id, existing.artistId)))
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    const [leave] = await db
      .update(schema.leaves)
      .set({ status: b.status, decidedByUserId: (await getSessionUser())?.id })
      .where(eq(schema.leaves.id, b.id))
      .returning({ artistId: schema.leaves.artistId });

    // 아티스트(연결 계정)에 승인/거절 알림
    if (leave) {
      const [artist] = await db
        .select({ userId: schema.artists.userId })
        .from(schema.artists)
        .where(eq(schema.artists.id, leave.artistId))
        .limit(1);
      await notify(artist?.userId, {
        type: b.status === "approved" ? "leave_approved" : "leave_rejected",
        title: b.status === "approved" ? "휴가가 승인됐어요" : "휴가가 거절됐어요",
        link: "/me/leave",
      });
    }

    revalidatePath("/agency/schedule");
    revalidatePath("/me");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[leave decide]", e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
