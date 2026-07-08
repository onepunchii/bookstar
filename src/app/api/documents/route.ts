import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";

const DOC_TYPES = ["계약서", "큐시트", "공문", "정산서"];

// 서류 업로드 → Blob 저장 + documents 행 생성.
export async function POST(req: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  try {
    const form = await req.formData();
    const file = form.get("file");
    const type = String(form.get("type") ?? "계약서");
    const eventTitle = String(form.get("eventTitle") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file 누락" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "20MB 초과" }, { status: 413 });
    }
    if (!DOC_TYPES.includes(type)) {
      return NextResponse.json({ error: "잘못된 유형" }, { status: 400 });
    }

    const db = getDb();
    // 세션 소속사 우선, 데모(미가입)는 시드 소속사
    const [own] = await db
      .select({ id: schema.agencies.id })
      .from(schema.agencies)
      .where(eq(schema.agencies.ownerId, uid))
      .limit(1);
    const [fallback] = own
      ? [own]
      : await db.select({ id: schema.agencies.id }).from(schema.agencies).limit(1);
    if (!fallback) {
      return NextResponse.json({ error: "소속사 없음" }, { status: 400 });
    }

    const safeName = file.name.replace(/[^\w.\-가-힣 ]/g, "_");
    const blob = await put(`docs/${fallback.id}/${Date.now()}-${safeName}`, file, {
      access: "public",
    });

    const [row] = await db
      .insert(schema.documents)
      .values({
        agencyId: fallback.id,
        name: file.name,
        type,
        eventTitle: eventTitle || null,
        fileUrl: blob.url,
      })
      .returning({ id: schema.documents.id, createdAt: schema.documents.createdAt });

    revalidatePath("/agency/docs");
    return NextResponse.json({
      ok: true,
      id: row.id,
      url: blob.url,
      date: row.createdAt.toISOString().slice(0, 10),
    });
  } catch (e) {
    console.error("[document upload]", e);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
