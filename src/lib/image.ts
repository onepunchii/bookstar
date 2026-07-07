"use client";

// 업로드 이미지를 브라우저에서 WebP로 변환한다.
// 긴 변 maxDim 이하로 리사이즈 + WebP 인코딩 → 용량 대폭 절감.
export interface WebPResult {
  blob: Blob;
  dataUrl: string;
  originalKB: number;
  webpKB: number;
  fileName: string; // .webp로 바뀐 파일명
}

export async function fileToWebP(
  file: File,
  maxDim = 1600,
  quality = 0.85
): Promise<WebPResult> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("캔버스 컨텍스트를 만들 수 없습니다");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("WebP 변환 실패"))),
      "image/webp",
      quality
    )
  );

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

  return {
    blob,
    dataUrl,
    originalKB: Math.round(file.size / 1024),
    webpKB: Math.round(blob.size / 1024),
    fileName: file.name.replace(/\.[^.]+$/, "") + ".webp",
  };
}
