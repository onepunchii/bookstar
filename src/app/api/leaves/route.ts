import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";

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
    await db
      .update(schema.leaves)
      .set({ status: b.status })
      .where(eq(schema.leaves.id, b.id));
    revalidatePath("/agency/schedule");
    revalidatePath("/me");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[leave decide]", e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
