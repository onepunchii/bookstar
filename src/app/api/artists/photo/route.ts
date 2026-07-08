import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";

// 아티스트 사진 업로드 → Vercel Blob → DB 반영.
// slot 0 = 대표(image_url), slot 1~3 = 갤러리(gallery_urls[slot-1]).
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
    const slot = Number(form.get("slot") ?? 0);

    if (typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: "잘못된 slug" }, { status: 400 });
    }
    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "file 누락" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "5MB 초과" }, { status: 413 });
    }
    if (!Number.isInteger(slot) || slot < 0 || slot > 3) {
      return NextResponse.json({ error: "잘못된 slot" }, { status: 400 });
    }

    // 아티스트 존재 확인 (업로드 전에)
    const db = getDb();
    const [artist] = await db
      .select({
        id: schema.artists.id,
        galleryUrls: schema.artists.galleryUrls,
      })
      .from(schema.artists)
      .where(eq(schema.artists.slug, slug))
      .limit(1);
    if (!artist) {
      return NextResponse.json(
        { error: "해당 아티스트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // 슬롯별 고정 경로 덮어쓰기
    const path =
      slot === 0
        ? `artists/${slug}/cover.webp`
        : `artists/${slug}/gallery-${slot}.webp`;
    const blob = await put(path, file, {
      access: "public",
      contentType: "image/webp",
      allowOverwrite: true,
      addRandomSuffix: false,
    });

    if (slot === 0) {
      await db
        .update(schema.artists)
        .set({ imageUrl: blob.url })
        .where(eq(schema.artists.id, artist.id));
    } else {
      const gallery = [...((artist.galleryUrls as string[]) ?? [])];
      while (gallery.length < 3) gallery.push("");
      gallery[slot - 1] = blob.url;
      await db
        .update(schema.artists)
        .set({ galleryUrls: gallery })
        .where(eq(schema.artists.id, artist.id));
    }

    return NextResponse.json({ url: blob.url, slot });
  } catch (e) {
    console.error("[artist photo upload]", e);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
