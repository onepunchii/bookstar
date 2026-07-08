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
          "/booking",
          "/recommend",
          "/d/", // 데일리 시트 공유 링크
          "/api/",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
