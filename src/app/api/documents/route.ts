import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getSessionAgency } from "@/lib/data/session";

const DOC_TYPES = ["계약서", "큐시트", "공문", "정산서"];

// 서류 업로드 → Blob 저장 + documents 행 생성.
export async function POST(req: Request) {
  const agency = await getSessionAgency();
  if (!agency) {
    return NextResponse.json({ error: "소속사 인증이 필요합니다" }, { status: 401 });
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
    const safeName = file.name.replace(/[^\w.\-가-힣 ]/g, "_");
    const blob = await put(`docs/${agency.id}/${Date.now()}-${safeName}`, file, {
      access: "public",
    });

    const [row] = await db
      .insert(schema.documents)
      .values({
        agencyId: agency.id,
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
