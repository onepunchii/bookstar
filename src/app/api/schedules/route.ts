import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import type { Availability } from "@/lib/types";

// 소속사 일정관리 — 아티스트의 가능여부(availability)를 DB schedules에 upsert.
// 공개 프로필(/@slug)의 가용 캘린더에 즉시 반영.
interface Payload {
  artistId: string;
  slug?: string; // revalidate용 (있으면 공개 프로필 캐시 무효화)
  changes: { date: string; availability: Availability; note?: string | null }[];
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const body = (await req.json()) as Payload;
    if (!body.artistId || !Array.isArray(body.changes)) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }
    if (body.changes.length === 0) {
      return NextResponse.json({ ok: true, count: 0 });
    }

    const db = getDb();
    // (artist_id, date) 유니크 → upsert
    for (const c of body.changes) {
      await db
        .insert(schema.schedules)
        .values({
          artistId: body.artistId,
          date: c.date,
          availability: c.availability,
          publicNote: c.note ?? null,
        })
        .onConflictDoUpdate({
          target: [schema.schedules.artistId, schema.schedules.date],
          set: {
            availability: c.availability,
            publicNote: c.note ?? null,
            updatedAt: new Date(),
          },
        });
    }

    if (body.slug) revalidatePath(`/p/${body.slug}`);
    revalidatePath("/agency/schedule");

    return NextResponse.json({ ok: true, count: body.changes.length });
  } catch (e) {
    console.error("[schedules upsert]", e);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}

// 특정 아티스트의 일정 삭제(선택) — 현재 미사용, 향후 확장용
export async function DELETE(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }
    const { artistId, date } = (await req.json()) as {
      artistId: string;
      date: string;
    };
    if (!artistId || !date) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }
    const db = getDb();
    await db
      .delete(schema.schedules)
      .where(
        and(
          eq(schema.schedules.artistId, artistId),
          eq(schema.schedules.date, date)
        )
      );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[schedules delete]", e);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
