import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import type { DayStop } from "@/lib/types";

// 데일리 시트 CRUD — 소속사 콘솔 전용(인증 필수).
interface CreateBody {
  artistId: string;
  date: string;
  title: string;
  eventType?: string;
  manager?: string;
  vehicle?: string | null;
  memo?: string | null;
  stops: DayStop[];
}
interface UpdateBody extends Partial<CreateBody> {
  id: string;
  broadcast?: boolean;
}

async function requireUser() {
  const session = await auth();
  return session?.user ?? null;
}

// 생성
export async function POST(req: Request) {
  if (!(await requireUser()))
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  try {
    const b = (await req.json()) as CreateBody;
    if (!b.artistId || !b.date || !b.title) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }
    const db = getDb();
    const [row] = await db
      .insert(schema.daySchedules)
      .values({
        artistId: b.artistId,
        date: b.date,
        title: b.title,
        eventType: b.eventType ?? "행사",
        manager: b.manager || null,
        vehicle: b.vehicle || null,
        memo: b.memo || null,
        stops: b.stops ?? [],
      })
      .returning({ id: schema.daySchedules.id });
    revalidatePath("/agency/today");
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("[day create]", e);
    return NextResponse.json({ error: "생성 실패" }, { status: 500 });
  }
}

// 수정 / 전파
export async function PATCH(req: Request) {
  if (!(await requireUser()))
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  try {
    const b = (await req.json()) as UpdateBody;
    if (!b.id) return NextResponse.json({ error: "id 누락" }, { status: 400 });

    const patch: Partial<typeof schema.daySchedules.$inferInsert> = {};
    if (b.artistId !== undefined) patch.artistId = b.artistId;
    if (b.date !== undefined) patch.date = b.date;
    if (b.title !== undefined) patch.title = b.title;
    if (b.eventType !== undefined) patch.eventType = b.eventType;
    if (b.manager !== undefined) patch.manager = b.manager || null;
    if (b.vehicle !== undefined) patch.vehicle = b.vehicle || null;
    if (b.memo !== undefined) patch.memo = b.memo || null;
    if (b.stops !== undefined) patch.stops = b.stops;
    if (b.broadcast) patch.broadcastAt = new Date();

    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "변경 없음" }, { status: 400 });
    }
    const db = getDb();
    const updated = await db
      .update(schema.daySchedules)
      .set(patch)
      .where(eq(schema.daySchedules.id, b.id))
      .returning({ id: schema.daySchedules.id });
    if (updated.length === 0)
      return NextResponse.json({ error: "없는 시트" }, { status: 404 });
    revalidatePath("/agency/today");
    revalidatePath(`/d/${b.id}`);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[day update]", e);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}

// 삭제
export async function DELETE(req: Request) {
  if (!(await requireUser()))
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  try {
    const { id } = (await req.json()) as { id: string };
    if (!id) return NextResponse.json({ error: "id 누락" }, { status: 400 });
    const db = getDb();
    await db.delete(schema.daySchedules).where(eq(schema.daySchedules.id, id));
    revalidatePath("/agency/today");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[day delete]", e);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
