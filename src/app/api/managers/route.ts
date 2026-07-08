import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";

// 매니저 초대(생성)·담당 아티스트 배정.
export async function POST(req: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  try {
    const b = (await req.json()) as {
      name: string;
      role?: string;
      phone?: string;
    };
    if (!b.name?.trim()) {
      return NextResponse.json({ error: "이름 누락" }, { status: 400 });
    }
    const db = getDb();
    const [own] = await db
      .select({ id: schema.agencies.id })
      .from(schema.agencies)
      .where(eq(schema.agencies.ownerId, uid))
      .limit(1);
    const [agency] = own
      ? [own]
      : await db.select({ id: schema.agencies.id }).from(schema.agencies).limit(1);
    if (!agency) {
      return NextResponse.json({ error: "소속사 없음" }, { status: 400 });
    }
    const [row] = await db
      .insert(schema.managers)
      .values({
        agencyId: agency.id,
        name: b.name.trim(),
        role: b.role?.trim() || "로드매니저",
        phone: b.phone?.trim() || null,
        artistIds: [],
      })
      .returning({ id: schema.managers.id });
    revalidatePath("/agency/settings");
    return NextResponse.json({ ok: true, id: row.id });
  } catch (e) {
    console.error("[manager create]", e);
    return NextResponse.json({ error: "초대 실패" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  try {
    const b = (await req.json()) as { id: string; artistIds: string[] };
    if (!b.id || !Array.isArray(b.artistIds)) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }
    const db = getDb();
    const updated = await db
      .update(schema.managers)
      .set({ artistIds: b.artistIds })
      .where(eq(schema.managers.id, b.id))
      .returning({ id: schema.managers.id });
    if (updated.length === 0) {
      return NextResponse.json({ error: "없는 매니저" }, { status: 404 });
    }
    revalidatePath("/agency/settings");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[manager assign]", e);
    return NextResponse.json({ error: "배정 실패" }, { status: 500 });
  }
}
