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
    const name = (file as File).name ?? "";
    const hint = `${type} ${name}`.toLowerCase();
    // 진단용 — 무슨 파일이 올라오는지(형식·크기) 로그로 확인
    console.log("[agency doc] upload", { type, name, size: file.size });

    // CLOVA 사업자등록증 특화 모델은 JPG·PNG·PDF만 인식. 아이폰 HEIC·WEBP 등은 거부.
    if (/(heic|heif|webp|gif|bmp|svg|avif|tiff?)/.test(hint)) {
      return NextResponse.json(
        {
          error:
            "사업자등록증은 JPG·PNG·PDF로 올려주세요. 아이폰 HEIC 사진은 인식이 안 돼요 — 캡처하거나 JPG로 저장해 올려주세요.",
        },
        { status: 415 }
      );
    }

    const ext: "jpg" | "png" | "pdf" =
      hint.includes("pdf") || name.toLowerCase().endsWith(".pdf")
        ? "pdf"
        : hint.includes("png") || name.toLowerCase().endsWith(".png")
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
      extractBizLicense(buf, ext),
    ]);
    console.log("[agency doc] ocr", {
      ext,
      got: !!ocr,
      fields: ocr
        ? Object.entries(ocr)
            .filter(([, v]) => v)
            .map(([k]) => k)
        : null,
    });

    return NextResponse.json({ url: blob.url, ocr });
  } catch (e) {
    console.error("[agency doc]", e);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
