import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";

const UUID = /^[0-9a-f-]{36}$/;

// 소속사 인증 서류(사업자등록증 등) 업로드 → Blob → URL 반환.
// PDF·이미지 허용, 원본 형식 유지.
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
    if (file.size > 10 * 1024 * 1024)
      return NextResponse.json({ error: "10MB 초과" }, { status: 413 });

    const type = file.type || "application/octet-stream";
    const ext = type.includes("pdf")
      ? "pdf"
      : type.includes("png")
        ? "png"
        : "jpg";
    const blob = await put(`agency-docs/${uid}/business.${ext}`, file, {
      access: "public",
      contentType: type,
      addRandomSuffix: true,
    });
    return NextResponse.json({ url: blob.url });
  } catch (e) {
    console.error("[agency doc]", e);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
