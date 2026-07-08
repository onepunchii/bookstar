import type { MetadataRoute } from "next";
import { getPublicArtists } from "@/lib/data/artists";
import { GUIDES } from "@/lib/guides";
import { SITE, absoluteUrl, artistPublicUrl } from "@/lib/site";
import { CATEGORY_LABELS, type ArtistCategory } from "@/lib/types";

// 동적 사이트맵 — Neon의 artists 테이블을 읽어, 소속사가 아티스트를 등록하면
// 공개 프로필 URL(@슬러그)과 프로필 이미지가 자동으로 사이트맵에 추가된다.
export const revalidate = 3600; // 1시간마다 재생성

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const artists = await getPublicArtists();

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

  // 1.5) 섭외 가이드 — 정보성 쿼리("연예인 섭외 비용" 등)·AI 개요 인용 타깃
  const guidePages: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/guide"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...GUIDES.map((g) => ({
      url: absoluteUrl(`/guide/${encodeURIComponent(g.slug)}`),
      lastModified: new Date(g.updated),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
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
  const artistPages: MetadataRoute.Sitemap = artists
    .filter((a) => a.slug)
    .map((a) => ({
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

  return [...staticPages, ...guidePages, ...categoryPages, ...artistPages];
}
