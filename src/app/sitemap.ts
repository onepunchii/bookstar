import type { MetadataRoute } from "next";
import { ARTISTS } from "@/lib/mock-data";
import { SITE, absoluteUrl, artistPublicUrl } from "@/lib/site";
import { CATEGORY_LABELS, type ArtistCategory } from "@/lib/types";

// 동적 사이트맵 — 아티스트 데이터 소스(현재 mock, 향후 Neon)를 읽어
// 소속사가 아티스트를 등록하면 자동으로 공개 프로필 URL이 추가된다.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // 1) 공개 정적 페이지
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE.url, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: absoluteUrl("/artists"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/join"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: absoluteUrl("/join/creator"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: absoluteUrl("/join/agency"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // 2) 카테고리별 아티스트 목록 ("아이돌 섭외" 등 검색 유입)
  const categoryPages: MetadataRoute.Sitemap = (
    Object.keys(CATEGORY_LABELS) as ArtistCategory[]
  ).map((c) => ({
    url: absoluteUrl(`/artists?category=${c}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // 3) 아티스트 공개 프로필 — 이미지 사이트맵 포함
  const artistPages: MetadataRoute.Sitemap = ARTISTS.filter(
    (a) => a.slug
  ).map((a) => ({
    url: artistPublicUrl(a.slug),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
    // 프로필 이미지(WebP)가 있으면 실제 이미지, 없으면 자동 생성 OG 카드
    // (OG 라우트는 실제 파일 경로 /p/[slug]/opengraph-image — @-리라이트는 단일 세그먼트만 매칭)
    images: [
      a.imageUrl
        ? absoluteUrl(a.imageUrl)
        : `${SITE.url}/p/${a.slug}/opengraph-image`,
    ],
  }));

  return [...staticPages, ...categoryPages, ...artistPages];
}
