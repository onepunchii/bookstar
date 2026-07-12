import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getSessionAgency } from "@/lib/data/session";
import { agencyOwnsArtist } from "@/lib/data/ownership";

// 홀드 생성(요청 수락 시)·해제 — 소속사 콘솔.
interface PlaceBody {
  artistId: string;
  date: string;
  requestId?: string;
  companyName?: string;
  expiresAt: string;
}

export async function POST(req: Request) {
  const agency = await getSessionAgency();
  if (!agency)
    return NextResponse.json({ error: "소속사 인증이 필요합니다" }, { status: 401 });
  try {
    const b = (await req.json()) as PlaceBody;
    if (!b.artistId || !b.date || !b.expiresAt) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }
    if (!(await agencyOwnsArtist(agency.id, b.artistId)))
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    const db = getDb();
    await db.insert(schema.holds).values({
      artistId: b.artistId,
      date: b.date,
      requestId: b.requestId || null,
      companyName: b.companyName || null,
      expiresAt: b.expiresAt,
    });
    revalidatePath("/agency/schedule");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[hold place]", e);
    return NextResponse.json({ error: "홀드 실패" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const agency = await getSessionAgency();
  if (!agency)
    return NextResponse.json({ error: "소속사 인증이 필요합니다" }, { status: 401 });
  try {
    const { artistId, date } = (await req.json()) as {
      artistId: string;
      date: string;
    };
    if (!artistId || !date) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }
    if (!(await agencyOwnsArtist(agency.id, artistId)))
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    const db = getDb();
    await db
      .delete(schema.holds)
      .where(
        and(eq(schema.holds.artistId, artistId), eq(schema.holds.date, date))
      );
    revalidatePath("/agency/schedule");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[hold release]", e);
    return NextResponse.json({ error: "해제 실패" }, { status: 500 });
  }
}
