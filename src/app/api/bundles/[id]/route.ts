import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { deleteBundle } from "@/lib/data/bundles";
import { getSessionAgency } from "@/lib/data/session";

// 번들 삭제 — 본인 소속사 것만.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const agency = await getSessionAgency();
  if (!agency)
    return NextResponse.json({ error: "권한이 없어요" }, { status: 401 });
  try {
    const { id } = await params;
    await deleteBundle(id, agency.id);
    revalidatePath("/agency");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[bundles:delete]", e);
    return NextResponse.json({ error: "삭제 실패" }, { status: 500 });
  }
}
