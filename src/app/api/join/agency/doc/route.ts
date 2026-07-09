import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { extractBizLicense } from "@/lib/clova-ocr";

const UUID = /^[0-9a-f-]{36}$/;

// 소속사 인증 서류(사업자등록증 등) 업로드 → Blob 저장 + CLOVA OCR 자동 인식.
// OCR 키 없거나 실패해도 업로드는 성공(수동 입력 폴백).
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

    const buf = await file.arrayBuffer();
    // 업로드와 OCR을 병렬로 — OCR 실패해도 업로드는 유지
    const [blob, ocr] = await Promise.all([
      put(`agency-docs/${uid}/business.${ext}`, Buffer.from(buf), {
        access: "public",
        contentType: type,
        addRandomSuffix: true,
      }),
      extractBizLicense(buf, ext as "jpg" | "png" | "pdf"),
    ]);

    return NextResponse.json({ url: blob.url, ocr });
  } catch (e) {
    console.error("[agency doc]", e);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
