// 앱 랜딩 (/app) — 앱 다운로드 전용 공개 페이지.
//
// ★ 목적: Play·App Store 페이지는 구글 웹 검색에 색인되는 웹페이지다. 이미 색인이 잡힌
//   이 사이트에서 크롤러가 볼 수 있는 실링크를 걸어 스토어 페이지로 신호를 흘려보낸다.
//   그래서 스토어 링크는 반드시 서버 렌더된 <a href> 여야 한다(숨김 링크 금지).
//
// 문구 원칙: 앱이 **실제로 하는 것만** 쓴다. 과장·보장·순위 주장을 넣지 않는다.
//   여기 적힌 기능은 모두 코드로 확인된 것이다 —
//   탐색(/artists · CATEGORY_LABELS), 예상 견적·응답률(공개 프로필), 섭외 요청·견적
//   회신(/requests), 푸시 알림(src/lib/push-native.ts · native-bridge.tsx),
//   로그인 없는 둘러보기(sample-launcher.tsx).
//
// 로케일: 봇은 ko 고정(/about 과 같은 AEO 정책), 사람은 쿠키·기기 언어대로.
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Eyebrow } from "@/components/premium/eyebrow";
import { PremiumCTA } from "@/components/premium/premium-cta";
import { SiteFooter } from "@/components/site-footer";
import { StoreBadges } from "@/components/store-badges";
import { getT } from "@/lib/i18n/server";
import { SITE, absoluteUrl } from "@/lib/site";
import { APP_STORE_URL, PLAY_URL } from "@/lib/store-links";
import { Bell, FileText, Search, Wallet } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT({ botDefault: "ko" });
  return {
    title: t("appPage.metaTitle"),
    description: t("appPage.metaDesc"),
    alternates: { canonical: "/app" },
    openGraph: {
      type: "website",
      title: t("appPage.metaTitle"),
      description: t("appPage.metaDesc"),
      url: absoluteUrl("/app"),
    },
  };
}

export default async function AppLandingPage() {
  const { t, locale } = await getT({ botDefault: "ko" });

  const FEATURES = [
    { icon: Search, t: t("appPage.feat1Title"), d: t("appPage.feat1Desc") },
    { icon: Wallet, t: t("appPage.feat2Title"), d: t("appPage.feat2Desc") },
    { icon: FileText, t: t("appPage.feat3Title"), d: t("appPage.feat3Desc") },
    { icon: Bell, t: t("appPage.feat4Title"), d: t("appPage.feat4Desc") },
  ];

  // 스토어 스크린샷 재사용(store/screenshots/out/ko) — webp 로 줄여 public 에 둔다.
  const SHOTS = [
    { src: "/app-shot-home.webp", alt: t("appPage.shot1Alt") },
    { src: "/app-shot-artists.webp", alt: t("appPage.shot2Alt") },
    { src: "/app-shot-ai.webp", alt: t("appPage.shot3Alt") },
  ];

  const FAQ = [
    { q: t("appPage.faq1Q"), a: t("appPage.faq1A") },
    { q: t("appPage.faq2Q"), a: t("appPage.faq2A") },
    { q: t("appPage.faq3Q"), a: t("appPage.faq3A") },
  ];

  // SoftwareApplication — 평점은 넣지 않는다(실제 집계 데이터가 없으면 조작이다).
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "XONG",
      applicationCategory: "BusinessApplication",
      operatingSystem: "iOS, Android",
      url: absoluteUrl("/app"),
      installUrl: [APP_STORE_URL, PLAY_URL],
      description: t("appPage.metaDesc"),
      inLanguage: locale,
      publisher: { "@type": "Organization", name: "XONG", url: SITE.url },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "KRW",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      inLanguage: locale,
      mainEntity: FAQ.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: t("about.crumbHome"),
          item: SITE.url,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: t("appPage.crumb"),
          item: absoluteUrl("/app"),
        },
      ],
    },
  ];

  return (
    <div className="adv-dark min-h-dvh">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="mx-auto max-w-3xl px-5 py-14 sm:py-20">
        <nav className="text-xs text-white/35">
          <Link href="/" className="hover:text-white/60">
            {t("about.crumbHome")}
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-white/55">{t("appPage.crumb")}</span>
        </nav>

        <Eyebrow className="mt-6">XONG</Eyebrow>
        <h1 className="display-kr mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
          {t("appPage.h1")}
        </h1>
        <p
          className="mt-5 text-lg leading-relaxed text-white/75"
          style={{ wordBreak: "keep-all" }}
        >
          {t("appPage.intro")}
        </p>

        {/* ── 스토어 버튼 (서버 렌더 실링크) ── */}
        <div className="mt-8">
          <StoreBadges placement="app_landing" size="lg" />
        </div>

        {/* ── 핵심 기능 ── */}
        <h2 className="display-kr mt-14 text-2xl font-black text-white">
          {t("appPage.featuresHeading")}
        </h2>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.t}
              className="adv-card flex items-start gap-3 rounded-2xl p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                <f.icon className="h-4.5 w-4.5" />
              </span>
              <div>
                <p className="font-bold text-white">{f.t}</p>
                <p className="mt-0.5 text-sm text-white/55">{f.d}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── 스크린샷 (스토어 자산 재사용) ── */}
        <div className="mt-10 grid grid-cols-3 gap-3 sm:gap-5">
          {SHOTS.map((s) => (
            <Image
              key={s.src}
              src={s.src}
              alt={s.alt}
              width={540}
              height={1168}
              sizes="(max-width: 640px) 30vw, 220px"
              className="h-auto w-full rounded-2xl ring-1 ring-white/10"
            />
          ))}
        </div>

        {/* ── FAQ (FAQPage 스키마와 동기) ── */}
        <h2 className="display-kr mt-14 text-2xl font-black text-white">
          {t("about.faqHeading")}
        </h2>
        <div className="mt-5 divide-y divide-white/[0.08]">
          {FAQ.map((f) => (
            <div key={f.q} className="py-5">
              <h3 className="text-base font-bold text-white">{f.q}</h3>
              <p
                className="mt-2 text-sm leading-relaxed text-white/60"
                style={{ wordBreak: "keep-all" }}
              >
                {f.a}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3">
          <PremiumCTA href="/artists" variant="solid">
            {t("about.ctaArtists")}
          </PremiumCTA>
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-5 py-3 text-sm font-bold text-white hover:bg-white/12"
          >
            {t("about.crumbCurrent")}
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
