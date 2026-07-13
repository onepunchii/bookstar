import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ErrorReporter } from "@/components/error-reporter";
import NativeBridge from "@/components/native-bridge";
import { auth } from "@/auth";
import { getAgencyCapability, getViewer } from "@/lib/data/session";
import { SITE } from "@/lib/site";

export const viewport: Viewport = {
  // 스플래시·주소창 배경 블랙
  themeColor: "#000000",
  // 네이티브 쉘(iOS 노치)에서 safe-area env() 값이 나오도록
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "XONG",
    statusBarStyle: "black-translucent",
  },
  title: {
    // 핵심 키워드("연예인 섭외") 전진 배치 + 차별화(섭외가 공개·수수료 0%)
    default: "연예인 섭외·인플루언서 섭외 — XONG | 섭외가 공개 · 수수료 0%",
    template: "%s · xong",
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  applicationName: "XONG",
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  // canonical은 페이지별로 지정(홈=page.tsx, /artists·/join 등). 루트에서 "/"로 고정하면
  // 하위 페이지가 이를 상속해 전부 홈 중복으로 정규화되는 문제가 생긴다.
  icons: {
    icon: [{ url: "/app.png", type: "image/png" }],
    shortcut: "/app.png",
    apple: "/app.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: "연예인 섭외·인플루언서 섭외 — XONG | 섭외가 공개 · 수수료 0%",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    title: "연예인 섭외·인플루언서 섭외 — XONG",
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  verification: {
    other: {
      "naver-site-verification": "0ac11df6322e1b95befaf066e8216510902567c1",
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const agencyCapability = session?.user
    ? await getAgencyCapability()
    : "none";
  const viewer = await getViewer();
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
        {/* 사이트 전역 구조화 데이터 — Organization + WebSite (검색·AI 개요 신뢰 시그널) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "XONG",
                alternateName: "쏭",
                url: SITE.url,
                logo: `${SITE.url}/app.png`,
                description: SITE.description,
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "XONG",
                url: SITE.url,
                inLanguage: "ko",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${SITE.url}/artists?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
      </head>
      <body className="min-h-full bg-white text-neutral-900">
        <AppShell
          isAdmin={isAdmin}
          agencyCapability={agencyCapability}
          viewer={viewer}
        >
          {children}
        </AppShell>
        <ErrorReporter />
        <NativeBridge />
      </body>
    </html>
  );
}
