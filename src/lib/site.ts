// 사이트 전역 SEO 상수 — 한 곳에서 관리
export const SITE = {
  name: "xong",
  fullName: "xong · eXperience ON",
  url: "https://www.xong.co.kr",
  locale: "ko_KR",
  description:
    "연예인·인플루언서 섭외를 가장 빠르게 연결하는 B2B 부킹 OS. 대행사 거품 없이 검증된 소속사와 직접, 매칭 수수료 0%로 섭외하세요.",
  keywords: [
    "연예인 섭외",
    "아이돌 섭외",
    "인플루언서 섭외",
    "행사 섭외",
    "MC 섭외",
    "모델 섭외",
    "캐스팅",
    "부킹 플랫폼",
    "연예인 섭외 견적",
    "xong",
    "eXperience ON",
  ],
  twitter: "@xong_kr",
  ogImage: "/opengraph-image", // 동적 생성
} as const;

// 공개 아티스트 프로필의 정식(canonical) URL
export function artistPublicUrl(slug: string): string {
  return `${SITE.url}/@${slug}`;
}

// 절대 URL 헬퍼
export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE.url}${path.startsWith("/") ? "" : "/"}${path}`;
}
