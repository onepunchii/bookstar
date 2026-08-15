import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // 로그인 뒤 앱 화면·비공개 데이터는 색인 차단
        disallow: [
          "/agency",
          "/me",
          "/requests",
          // 슬래시 필수 — robots는 접두사 매칭이라 "/booking"은 공개 SEO 랜딩인
          // /booking-topic/*(=/섭외/*의 리라이트 대상)까지 함께 막아버린다.
          "/booking/",
          "/recommend",
          "/d/", // 데일리 시트 공유 링크
          "/api/",
          "/admin", // 관리자 — 크롤 예산 낭비·URL 노출 방지
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
