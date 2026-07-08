import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const UUID = /^[0-9a-f-]{36}$/;

// 캠페인 브랜드·레퍼런스 이미지 업로드 → Vercel Blob → URL 반환.
// 캠페인 생성 전에 올리므로 엔티티에 묶지 않고 URL만 돌려준다(클라가 생성 payload에 포함).
export async function POST(req: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid || !UUID.test(uid))
    return NextResponse.json({ error: "로그인이 필요해요" }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof Blob))
      return NextResponse.json({ error: "file 누락" }, { status: 400 });
    if (file.size > 5 * 1024 * 1024)
      return NextResponse.json({ error: "5MB 초과" }, { status: 413 });

    const blob = await put(`campaigns/${uid}/cover.webp`, file, {
      access: "public",
      contentType: "image/webp",
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("[campaign image]", e);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
