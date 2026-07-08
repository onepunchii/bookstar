// OG 이미지(ImageResponse)에서 한글 렌더링을 위한 Pretendard 폰트 로더.
// 실패 시 null → 기본 폰트로 폴백(한글은 안 나올 수 있으나 빌드는 안전).
const FONT_URLS: Record<number, string> = {
  700: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/public/static/Pretendard-Bold.ttf",
  500: "https://cdn.jsdelivr.net/gh/orioncactus/pretendard/packages/pretendard/dist/public/static/Pretendard-Medium.ttf",
};

export async function loadPretendard(
  weight: 500 | 700 = 700
): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(FONT_URLS[weight], { cache: "force-cache" });
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}
