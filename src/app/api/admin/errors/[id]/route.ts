import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/data/admin";

const STATUSES = new Set(["open", "resolved", "ignored"]);

// 에러 상태 변경 — 해결/무시/되돌리기
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  const { id } = await params;
  const { status } = (await req.json()) as { status?: string };
  if (!status || !STATUSES.has(status))
    return NextResponse.json({ error: "잘못된 상태" }, { status: 400 });

  const db = getDb();
  await db
    .update(schema.errorLogs)
    .set({ status })
    .where(eq(schema.errorLogs.id, id));
  return NextResponse.json({ ok: true });
}

// 완전 삭제 — 재발하면 새 행으로 다시 잡힌다
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin()))
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  const { id } = await params;
  const db = getDb();
  await db.delete(schema.errorLogs).where(eq(schema.errorLogs.id, id));
  return NextResponse.json({ ok: true });
}
