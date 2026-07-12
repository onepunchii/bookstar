import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getSessionAgency } from "@/lib/data/session";
import { agencyOwnsArtist } from "@/lib/data/ownership";

// 정산 CRUD — 소속사 콘솔 전용(세션 소속사가 소유한 아티스트만).
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

export async function POST(req: Request) {
  const agency = await getSessionAgency();
  if (!agency)
    return NextResponse.json({ error: "소속사 인증이 필요합니다" }, { status: 401 });
  try {
    const b = (await req.json()) as CreateBody;
    if (!b.artistId || !b.eventTitle || !b.gross) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }
    if (!(await agencyOwnsArtist(agency.id, b.artistId)))
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
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
  const agency = await getSessionAgency();
  if (!agency)
    return NextResponse.json({ error: "소속사 인증이 필요합니다" }, { status: 401 });
  try {
    const b = (await req.json()) as UpdateBody;
    if (!b.id) return NextResponse.json({ error: "id 누락" }, { status: 400 });
    // 대상 정산이 세션 소속사 소유 아티스트의 것인지 확인
    const db0 = getDb();
    const [target] = await db0
      .select({ artistId: schema.settlements.artistId })
      .from(schema.settlements)
      .where(eq(schema.settlements.id, b.id))
      .limit(1);
    if (!target)
      return NextResponse.json({ error: "없는 정산" }, { status: 404 });
    if (!(await agencyOwnsArtist(agency.id, target.artistId)))
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
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
