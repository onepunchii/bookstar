import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /@슬러그 → /p/슬러그 (파일 시스템은 /p/[slug], URL은 @-스타일)
  // /ir·/for/* → public/ 정적 아웃리치 문서 (IR·기획사·크리에이터 원페이저)
  async rewrites() {
    return [
      {
        source: "/@:slug",
        destination: "/p/:slug",
      },
      { source: "/ir", destination: "/ir.html" },
      { source: "/for/agency", destination: "/for-agency.html" },
      { source: "/for/creator", destination: "/for-creator.html" },
      { source: "/for/company", destination: "/for-company.html" },
      // /섭외/슬러그 → /booking-topic/슬러그 (한글 폴더명 라우팅 회피, URL은 한글 유지)
      { source: "/섭외/:slug", destination: "/booking-topic/:slug" },
      {
        source: "/%EC%84%AD%EC%99%B8/:slug",
        destination: "/booking-topic/:slug",
      },
    ];
  },
};

export default nextConfig;
