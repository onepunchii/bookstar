import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // /@슬러그 → /p/슬러그 (파일 시스템은 /p/[slug], URL은 @-스타일)
  async rewrites() {
    return [
      {
        source: "/@:slug",
        destination: "/p/:slug",
      },
    ];
  },
};

export default nextConfig;
