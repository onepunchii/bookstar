import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { ErrorReporter } from "@/components/error-reporter";
import NativeBridge from "@/components/native-bridge";
import VisitBeacon from "@/components/visit-beacon";
import AppInstallBanner from "@/components/app-install-banner";
import { auth } from "@/auth";
import { getAgencyCapability, getViewer } from "@/lib/data/session";
import { SITE } from "@/lib/site";
import { I18nProvider } from "@/lib/i18n/client";
import { getLocale, dictFor } from "@/lib/i18n/server";
import { dirOf } from "@/lib/i18n/locales";

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
  // 크롤러는 ko 고정 — 이 레이아웃이 내보내는 title·description·OG가 언어와 무관하게
  // 한국어이고 sitemap도 ko 단일 URL이라, 봇에 lang="en"이 나가면 본문·메타와 어긋난다.
  // (SEO 페이지 /about·/p/[slug]도 같은 botDefault를 쓴다. 사람 사용자는 영향 없음.)
  const locale = await getLocale({ botDefault: "ko" });
  const dir = dirOf(locale);
  const dict = dictFor(locale);
  return (
    <html lang={locale} dir={dir} className="h-full antialiased">
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
                "@id": `${SITE.url}/#organization`,
                name: "XONG",
                alternateName: ["쏭", "eXperience ON"],
                url: SITE.url,
                logo: `${SITE.url}/app.png`,
                description: SITE.description,
                slogan: "섭외가 공개 · 매칭 수수료 0%",
                foundingDate: "2026",
                areaServed: { "@type": "Country", name: "South Korea" },
                knowsAbout: [
                  "연예인 섭외",
                  "인플루언서 섭외",
                  "아이돌 섭외",
                  "행사 섭외",
                  "브랜드 앰배서더",
                  "캐스팅",
                  "부킹 플랫폼",
                ],
                sameAs: ["https://x.com/xong_kr"],
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
        <I18nProvider initialLocale={locale} initialDict={dict}>
          <AppShell
            isAdmin={isAdmin}
            agencyCapability={agencyCapability}
            viewer={viewer}
          >
            {children}
          </AppShell>
          {/* 앱 설치 유도 — I18nProvider 안에 두어야 useT() 가 동작한다.
              네이티브 앱·PWA·데스크톱에서는 컴포넌트가 스스로 숨는다. */}
          <AppInstallBanner />
        </I18nProvider>
        <ErrorReporter />
        <NativeBridge />
        {/* 일별 유니크 접속자 비콘 — localStorage 게이트로 하루 1회만 전송 */}
        <VisitBeacon />
      </body>
    </html>
  );
}
