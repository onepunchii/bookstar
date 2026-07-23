import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/premium/eyebrow";
import { PremiumCTA } from "@/components/premium/premium-cta";
import { SITE, absoluteUrl } from "@/lib/site";
import { getT, getLocale } from "@/lib/i18n/server";
import {
  ArrowUpRight,
  BadgeCheck,
  Check,
  Megaphone,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

// AEO/GEO 엔티티 허브 — "XONG이란?"을 AI 개요·검색이 인용하도록 정의·사실·FAQ를 구조화.
// 로케일 인식: 앱 사용자는 활성 언어로, 크롤러(쿠키 없음→ko 기본)는 한국어로 렌더 → AEO 유지.
const UPDATED = "2026-07-21";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("about.metaTitle"),
    description: t("about.metaDesc"),
    alternates: { canonical: "/about" },
    openGraph: {
      type: "website",
      title: t("about.ogTitle"),
      description: t("about.ogDesc"),
      url: absoluteUrl("/about"),
    },
  };
}

export default async function AboutPage() {
  const { t } = await getT();
  const locale = await getLocale();

  const FAQ = [
    { q: t("about.faq1Q"), a: t("about.faq1A") },
    { q: t("about.faq2Q"), a: t("about.faq2A") },
    { q: t("about.faq3Q"), a: t("about.faq3A") },
    { q: t("about.faq4Q"), a: t("about.faq4A") },
    { q: t("about.faq5Q"), a: t("about.faq5A") },
    { q: t("about.faq6Q"), a: t("about.faq6A") },
    { q: t("about.faq7Q"), a: t("about.faq7A") },
    { q: t("about.faq8Q"), a: t("about.faq8A") },
    { q: t("about.faq9Q"), a: t("about.faq9A") },
  ];

  const FACTS = [
    { icon: BadgeCheck, t: t("about.fact1Title"), d: t("about.fact1Desc") },
    { icon: Search, t: t("about.fact2Title"), d: t("about.fact2Desc") },
    { icon: Users, t: t("about.fact3Title"), d: t("about.fact3Desc") },
    { icon: Sparkles, t: t("about.fact4Title"), d: t("about.fact4Desc") },
  ];

  const COMPARE = [
    { label: t("about.cmp1Label"), legacy: t("about.cmp1Legacy"), xong: t("about.cmp1Xong") },
    { label: t("about.cmp2Label"), legacy: t("about.cmp2Legacy"), xong: t("about.cmp2Xong") },
    { label: t("about.cmp3Label"), legacy: t("about.cmp3Legacy"), xong: t("about.cmp3Xong") },
    { label: t("about.cmp4Label"), legacy: t("about.cmp4Legacy"), xong: t("about.cmp4Xong") },
    { label: t("about.cmp5Label"), legacy: t("about.cmp5Legacy"), xong: t("about.cmp5Xong") },
  ];

  const WHO = [
    { icon: Megaphone, t: t("about.who1Title"), d: t("about.who1Desc") },
    { icon: Users, t: t("about.who2Title"), d: t("about.who2Desc") },
    { icon: Sparkles, t: t("about.who3Title"), d: t("about.who3Desc") },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "XONG",
      alternateName: ["쏭", "eXperience ON"],
      url: SITE.url,
      logo: `${SITE.url}/app.png`,
      description: t("about.metaDesc"),
      slogan: t("about.orgSlogan"),
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
      "@type": "Service",
      name: t("about.serviceName"),
      serviceType: t("about.serviceType"),
      provider: { "@type": "Organization", name: "XONG", url: SITE.url },
      areaServed: { "@type": "Country", name: "South Korea" },
      description: t("about.serviceDesc"),
      offers: {
        "@type": "Offer",
        description: t("about.offerDesc"),
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
        { "@type": "ListItem", position: 1, name: t("about.crumbHome"), item: SITE.url },
        { "@type": "ListItem", position: 2, name: t("about.crumbCurrent"), item: absoluteUrl("/about") },
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
          <span className="text-white/55">{t("about.crumbCurrent")}</span>
        </nav>

        {/* ── 정의 (첫 200자에 핵심) ── */}
        <Eyebrow className="mt-6">{t("about.eyebrow")}</Eyebrow>
        <h1 className="display-kr mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
          {t("about.h1")}
        </h1>
        <p
          className="mt-5 text-lg leading-relaxed text-white/75"
          style={{ wordBreak: "keep-all" }}
        >
          {t("about.intro")}
        </p>

        {/* ── 핵심 사실 (추출 가능한 팩트) ── */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {FACTS.map((f) => (
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

        {/* ── 비교표 (AI가 인용하기 좋은 표) ── */}
        <h2 className="display-kr mt-14 text-2xl font-black text-white">
          {t("about.compareHeading")}
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="py-3 pr-4 font-semibold"> </th>
                <th className="py-3 pr-4 font-semibold">{t("about.compareColLegacy")}</th>
                <th className="py-3 font-semibold text-brand-300">XONG</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE.map((r) => (
                <tr key={r.label} className="border-b border-white/[0.06]">
                  <td className="py-3 pr-4 font-bold text-white/80">{r.label}</td>
                  <td className="py-3 pr-4 text-white/45">
                    <span className="flex items-center gap-1.5">
                      <X className="h-3.5 w-3.5 shrink-0 text-white/25" />
                      {r.legacy}
                    </span>
                  </td>
                  <td className="py-3 font-semibold text-white">
                    <span className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 shrink-0 text-brand-400" />
                      {r.xong}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── 누가 쓰나 ── */}
        <h2 className="display-kr mt-14 text-2xl font-black text-white">
          {t("about.whoHeading")}
        </h2>
        <div className="mt-5 space-y-3">
          {WHO.map((r) => (
            <div key={r.t} className="adv-card flex items-start gap-4 rounded-2xl p-5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-brand-300">
                <r.icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-white">{r.t}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/55">{r.d}</p>
              </div>
            </div>
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
              <p className="mt-2 text-sm leading-relaxed text-white/60" style={{ wordBreak: "keep-all" }}>
                {f.a}
              </p>
            </div>
          ))}
        </div>

        {/* ── 내부 링크(엔티티 그래프) + CTA ── */}
        <div className="mt-12 flex flex-wrap gap-3">
          <PremiumCTA href="/artists" variant="solid">
            {t("about.ctaArtists")}
          </PremiumCTA>
          <Link
            href="/guide"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-5 py-3 text-sm font-bold text-white hover:bg-white/12"
          >
            {t("about.ctaGuide")} <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-10 text-xs text-white/30">
          {t("about.updatedPrefix")}: {UPDATED} · XONG · www.xong.co.kr
        </p>
      </main>
    </div>
  );
}
