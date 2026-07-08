import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { agencyUserForArtist, notify } from "@/lib/data/notify";

// 휴가 신청(아티스트) / 승인·거절(소속사). 아티스트측 미인증이라 공개.
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
  try {
    const b = (await req.json()) as CreateBody;
    if (!b.artistId || !b.startDate || !b.endDate) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }
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
  try {
    const b = (await req.json()) as DecideBody;
    if (!b.id || !b.status) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }
    const db = getDb();
    const [leave] = await db
      .update(schema.leaves)
      .set({ status: b.status })
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
        type: "leave_approved",
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
