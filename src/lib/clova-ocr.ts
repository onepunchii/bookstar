// CLOVA OCR — 사업자등록증 특화 모델(네이버 클라우드).
// env: CLOVA_OCR_URL(도메인 Invoke URL) + CLOVA_OCR_SECRET. 없으면 null(수동 입력 폴백).
// https://api.ncloud-docs.com/docs/ai-application-service-ocr

export interface BizLicenseFields {
  companyName: string | null; // 상호
  repName: string | null; // 대표자
  bizNumber: string | null; // 사업자등록번호
  address: string | null; // 사업장 소재지
}

interface OcrField {
  text?: string;
}

export async function extractBizLicense(
  buf: ArrayBuffer,
  format: "jpg" | "png" | "pdf"
): Promise<BizLicenseFields | null> {
  const url = process.env.CLOVA_OCR_URL;
  const secret = process.env.CLOVA_OCR_SECRET;
  if (!url || !secret) return null;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-OCR-SECRET": secret,
      },
      body: JSON.stringify({
        version: "V2",
        requestId: crypto.randomUUID(),
        timestamp: Date.now(),
        images: [
          {
            format,
            name: "biz-license",
            data: Buffer.from(buf).toString("base64"),
          },
        ],
      }),
      // OCR 처리 지연 대비
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      console.error("[clova-ocr] HTTP", res.status, await res.text());
      return null;
    }
    const data = (await res.json()) as {
      images?: {
        inferResult?: string;
        bizLicense?: {
          result?: {
            companyName?: OcrField[];
            corpName?: OcrField[];
            repName?: OcrField[];
            registerNumber?: OcrField[];
            bisAddress?: OcrField[];
          };
        };
      }[];
    };
    const img = data.images?.[0];
    if (!img || img.inferResult === "ERROR") return null;
    const r = img.bizLicense?.result;
    if (!r) return null;

    const pick = (fields?: OcrField[]) =>
      fields?.map((f) => f.text?.trim()).filter(Boolean).join(" ") || null;

    return {
      // 법인은 corpName, 개인사업자는 companyName에 상호가 실림
      companyName: pick(r.companyName) ?? pick(r.corpName),
      repName: pick(r.repName),
      bizNumber: pick(r.registerNumber),
      address: pick(r.bisAddress),
    };
  } catch (e) {
    console.error("[clova-ocr]", e instanceof Error ? e.message : e);
    return null;
  }
}
