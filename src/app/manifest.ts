import type { MetadataRoute } from "next";

// PWA 매니페스트 — 홈 화면 추가 시 앱 아이콘·스플래시(블랙 배경).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "XONG · eXperience ON",
    short_name: "XONG",
    description: "연예인·인플루언서 섭외를 가장 빠르게 연결하는 B2B 부킹 OS",
    lang: "ko",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/app.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/app.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
