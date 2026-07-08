import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";

// 정산 CRUD — 소속사 콘솔 전용(인증 필수).
interface CreateBody {
  artistId: string;
  eventTitle: string;
  eventDate?: string;
  gross: number;
  agencyRateBp: number;
  status?: "paid" | "pending" | "overdue";
  taxInvoice?: boolean;
}
interface UpdateBody {
  id: string;
  status?: "paid" | "pending" | "overdue";
  taxInvoice?: boolean;
  gross?: number;
  agencyRateBp?: number;
}

async function requireUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function POST(req: Request) {
  if (!(await requireUser()))
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  try {
    const b = (await req.json()) as CreateBody;
    if (!b.artistId || !b.eventTitle || !b.gross) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }
    const db = getDb();
    const [row] = await db
      .insert(schema.settlements)
      .values({
        artistId: b.artistId,
        eventTitle: b.eventTitle,
        eventDate: b.eventDate || null,
        gross: b.gross,
        agencyRateBp: b.agencyRateBp ?? 3000,
        status: b.status ?? "pending",
        taxInvoice: b.taxInvoice ?? false,
      })
      .returning({ id: schema.settlements.id });
    revalidatePath("/agency/settlement");
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("[settlement create]", e);
    return NextResponse.json({ error: "등록 실패" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  if (!(await requireUser()))
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  try {
    const b = (await req.json()) as UpdateBody;
    if (!b.id) return NextResponse.json({ error: "id 누락" }, { status: 400 });
    const patch: Partial<typeof schema.settlements.$inferInsert> = {};
    if (b.status !== undefined) patch.status = b.status;
    if (b.taxInvoice !== undefined) patch.taxInvoice = b.taxInvoice;
    if (b.gross !== undefined) patch.gross = b.gross;
    if (b.agencyRateBp !== undefined) patch.agencyRateBp = b.agencyRateBp;
    if (b.status === "paid") patch.paidAt = new Date();
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "변경 없음" }, { status: 400 });
    }
    const db = getDb();
    const updated = await db
      .update(schema.settlements)
      .set(patch)
      .where(eq(schema.settlements.id, b.id))
      .returning({ id: schema.settlements.id });
    if (updated.length === 0)
      return NextResponse.json({ error: "없는 정산" }, { status: 404 });
    revalidatePath("/agency/settlement");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[settlement update]", e);
    return NextResponse.json({ error: "수정 실패" }, { status: 500 });
  }
}
