import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getSessionAgency } from "@/lib/data/session";
import { agencyOwnsAllArtists } from "@/lib/data/ownership";

// 매니저 초대(생성)·담당 아티스트 배정.
export async function POST(req: Request) {
  const agency = await getSessionAgency();
  if (!agency) {
    return NextResponse.json({ error: "소속사 인증이 필요합니다" }, { status: 401 });
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
  const agency = await getSessionAgency();
  if (!agency) {
    return NextResponse.json({ error: "소속사 인증이 필요합니다" }, { status: 401 });
  }
  try {
    const b = (await req.json()) as { id: string; artistIds: string[] };
    if (!b.id || !Array.isArray(b.artistIds)) {
      return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
    }
    // 배정하려는 아티스트가 모두 세션 소속사 소유인지 확인
    if (!(await agencyOwnsAllArtists(agency.id, b.artistIds)))
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    const db = getDb();
    // 매니저가 이 소속사 소속일 때만 수정 (id + agencyId 스코프)
    const updated = await db
      .update(schema.managers)
      .set({ artistIds: b.artistIds })
      .where(
        and(eq(schema.managers.id, b.id), eq(schema.managers.agencyId, agency.id))
      )
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
