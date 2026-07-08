import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";

// 소속사 아티스트 대표 사진 업로드 → Vercel Blob 저장 → artists.image_url 갱신.
// 클라이언트에서 이미 WebP로 변환한 Blob을 FormData(file)로 전송한다.
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
    }

    const form = await req.formData();
    const slug = form.get("slug");
    const file = form.get("file");

    if (typeof slug !== "string" || !slug) {
      return NextResponse.json({ error: "slug 누락" }, { status: 400 });
    }
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "file 누락" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "5MB 초과" }, { status: 413 });
    }

    // 아티스트당 대표 사진 1장 — 고정 경로 덮어쓰기
    const blob = await put(`artists/${slug}/cover.webp`, file, {
      access: "public",
      contentType: "image/webp",
      allowOverwrite: true,
      addRandomSuffix: false,
    });

    // DB 반영 — 공개 프로필·사이트맵 이미지가 이 URL을 즉시 참조
    const db = getDb();
    const updated = await db
      .update(schema.artists)
      .set({ imageUrl: blob.url })
      .where(eq(schema.artists.slug, slug))
      .returning({ id: schema.artists.id });

    if (updated.length === 0) {
      return NextResponse.json(
        { error: "해당 아티스트를 찾을 수 없습니다", url: blob.url },
        { status: 404 }
      );
    }

    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("[artist photo upload]", e);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
