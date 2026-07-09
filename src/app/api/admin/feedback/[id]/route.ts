import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/data/admin";

// 관리자: 건의 처리 상태 토글 (new ↔ done).
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  try {
    const { id } = await params;
    const { status } = (await req.json()) as { status?: string };
    const next = status === "done" ? "done" : "new";
    const db = getDb();
    await db
      .update(schema.feedbacks)
      .set({ status: next })
      .where(eq(schema.feedbacks.id, id));
    revalidatePath("/admin/feedback");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[admin feedback]", e);
    return NextResponse.json({ error: "처리 실패" }, { status: 500 });
  }
}
