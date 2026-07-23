import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/premium/eyebrow";
import { PremiumCTA } from "@/components/premium/premium-cta";
import { SITE, absoluteUrl } from "@/lib/site";
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
const UPDATED = "2026-07-21";

export const metadata: Metadata = {
  title: "XONG(쏭)이란? — 연예인·인플루언서 섭외 플랫폼 소개 | 수수료 0%",
  description:
    "XONG(쏭)은 연예인·인플루언서 섭외를 위한 B2B 부킹 플랫폼입니다. 대행사 거품 없이 검증된 소속사와 직접, 섭외가(견적) 공개·매칭 수수료 0%로 가수·아이돌·배우·MC·인플루언서를 섭외하세요.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    title: "XONG(쏭)이란? — 연예인·인플루언서 섭외 플랫폼",
    description:
      "섭외가 공개 · 매칭 수수료 0% · 검증된 소속사와 직접 연결. 연예인·인플루언서 섭외 B2B 부킹 OS.",
    url: absoluteUrl("/about"),
  },
};

const FAQ: { q: string; a: string }[] = [
  {
    q: "XONG(쏭)이란 무엇인가요?",
    a: "XONG(쏭)은 연예인·인플루언서 섭외를 위한 B2B 부킹 플랫폼입니다. 광고주·행사기획사가 가수·아이돌·배우·MC·모델·인플루언서·강연자를 카테고리별로 탐색하고, 공개된 프로필·예상 견적·응답률을 확인한 뒤 검증된 소속사에 직접 섭외를 요청합니다. 매칭 수수료는 0%입니다.",
  },
  {
    q: "연예인 섭외는 XONG에서 어떻게 진행되나요?",
    a: "① 카테고리·예산·일정으로 아티스트를 검색하고 ② 공개 프로필에서 가능 일정과 예상 견적을 확인한 뒤 ③ 표준 브리프로 섭외를 요청하면 담당 소속사가 견적으로 회신합니다. 협의·일정·정산까지 한곳에서 진행됩니다.",
  },
  {
    q: "XONG 이용 수수료가 있나요?",
    a: "광고주와 아티스트를 잇는 매칭 수수료는 0%입니다. 1인 기획사·유튜버·인플루언서는 무료로 이용하고, 다수 아티스트를 관리하는 대형 소속사는 SaaS 요금제(선택)를 씁니다.",
  },
  {
    q: "어떤 아티스트를 섭외할 수 있나요?",
    a: "가수·아이돌, 배우, MC·행사 진행자, 모델, 인플루언서·크리에이터, 강연자, 스포츠 선수 등 카테고리별로 섭외할 수 있습니다. 각 아티스트는 공개 프로필(@슬러그)과 가능 일정, 응답률·응답시간이 공개됩니다.",
  },
  {
    q: "섭외 비용(견적)은 어떻게 확인하나요?",
    a: "아티스트 프로필에 예상 예산대가 공개되며, 정확한 견적은 섭외 요청 시 소속사가 회신합니다. 행사 유형별(대학축제·기업행사·광고모델·인플루언서 협업) 시세는 XONG 섭외 가이드에서 확인할 수 있습니다.",
  },
  {
    q: "기존 섭외 대행사와 무엇이 다른가요?",
    a: "기존 대행사는 견적이 비공개이고 중간 마진이 붙지만, XONG은 섭외가를 공개하고 매칭 수수료 0%로 검증된 소속사와 직접 연결합니다. 응답률·응답시간이 투명하게 공개돼 더 빠르고 예측 가능합니다.",
  },
  {
    q: "소속사·기획사도 XONG을 쓸 수 있나요?",
    a: "네. 소속사는 소속사 콘솔에서 아티스트 프로필·가능 일정·섭외 인박스·견적·정산을 관리하고, 광고주의 섭외 요청을 직접 받습니다. 사업자 인증 후 즉시 사용할 수 있습니다.",
  },
  {
    q: "1인 크리에이터·인플루언서도 등록할 수 있나요?",
    a: "네. 소속사가 없는 크리에이터·인플루언서는 셀프 온보딩으로 3분 만에 나만의 섭외 링크를 발급받아, 브랜드가 직접 섭외 요청을 보낼 수 있게 할 수 있습니다.",
  },
  {
    q: "XONG 앱이 있나요?",
    a: "iOS·Android 앱과 웹(www.xong.co.kr) 모두에서 이용할 수 있습니다. 로그인 없이 '둘러보기'로 광고주·소속사·아티스트 화면을 미리 체험할 수도 있습니다.",
  },
];

const COMPARE: { label: string; legacy: string; xong: string }[] = [
  { label: "섭외가(견적)", legacy: "비공개 · 문의 후 통보", xong: "공개 · 비교 가능" },
  { label: "매칭 수수료", legacy: "중간 마진 15~30%", xong: "0%" },
  { label: "연결 방식", legacy: "대행사의 대행", xong: "검증된 소속사와 직접" },
  { label: "응답 투명성", legacy: "낮음", xong: "응답률·응답시간 공개" },
  { label: "진행 속도", legacy: "며칠~수주", xong: "프로필 확인 후 즉시 요청" },
];

export default function AboutPage() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
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
      "@type": "Service",
      name: "연예인·인플루언서 섭외",
      serviceType: "연예인·인플루언서 섭외 중개 플랫폼",
      provider: { "@type": "Organization", name: "XONG", url: SITE.url },
      areaServed: { "@type": "Country", name: "South Korea" },
      description:
        "검증된 소속사와 직접, 섭외가 공개·매칭 수수료 0%로 가수·아이돌·배우·MC·모델·인플루언서를 섭외하는 B2B 부킹 플랫폼.",
      offers: {
        "@type": "Offer",
        description: "매칭 수수료 0%",
        price: "0",
        priceCurrency: "KRW",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
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
        { "@type": "ListItem", position: 1, name: "홈", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "XONG 소개", item: absoluteUrl("/about") },
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
            홈
          </Link>
          <span className="mx-1.5">/</span>
          <span className="text-white/55">XONG 소개</span>
        </nav>

        {/* ── 정의 (첫 200자에 핵심) ── */}
        <Eyebrow className="mt-6">About XONG</Eyebrow>
        <h1 className="display-kr mt-3 text-3xl font-black leading-tight text-white sm:text-5xl">
          XONG(쏭)이란?
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-white/75">
          <strong className="text-white">XONG(쏭)</strong>은 연예인·인플루언서
          섭외를 위한 <strong className="text-white">B2B 부킹 플랫폼</strong>
          입니다. 광고주·행사기획사가 가수·아이돌·배우·MC·모델·인플루언서를
          카테고리별로 탐색하고, <strong className="text-brand-400">공개된
          섭외가(견적)</strong>와 응답률을 확인한 뒤{" "}
          <strong className="text-brand-400">검증된 소속사에 직접</strong>{" "}
          섭외를 요청합니다. 대행사 거품 없이,{" "}
          <strong className="text-brand-400">매칭 수수료 0%</strong>입니다.
        </p>

        {/* ── 핵심 사실 (추출 가능한 팩트) ── */}
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { icon: BadgeCheck, t: "매칭 수수료 0%", d: "광고주–아티스트 매칭에 중간 마진이 없어요" },
            { icon: Search, t: "섭외가 공개", d: "예상 견적·응답률·가능 일정을 미리 확인" },
            { icon: Users, t: "소속사와 직접", d: "대행의 대행이 아닌 검증된 소속사 직접 연결" },
            { icon: Sparkles, t: "웹·iOS·Android", d: "로그인 없이 둘러보기로 먼저 체험" },
          ].map((f) => (
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
          기존 섭외 대행사와 무엇이 다른가
        </h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/50">
                <th className="py-3 pr-4 font-semibold"> </th>
                <th className="py-3 pr-4 font-semibold">기존 섭외 대행사</th>
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
          누가 XONG을 쓰나요
        </h2>
        <div className="mt-5 space-y-3">
          {[
            { icon: Megaphone, t: "광고주 · 행사기획사", d: "브랜드 광고, 대학축제, 기업 행사, 팝업에 맞는 아티스트를 찾아 직접 섭외 요청." },
            { icon: Users, t: "소속사 · MCN", d: "아티스트 프로필·일정·섭외 인박스·견적·정산을 한 콘솔에서 관리하고 요청을 직접 수신." },
            { icon: Sparkles, t: "크리에이터 · 인플루언서", d: "소속사 없이도 셀프 온보딩으로 나만의 섭외 링크를 발급, 브랜드가 직접 연락." },
          ].map((r) => (
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
          자주 묻는 질문
        </h2>
        <div className="mt-5 divide-y divide-white/[0.08]">
          {FAQ.map((f) => (
            <div key={f.q} className="py-5">
              <h3 className="text-base font-bold text-white">{f.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.a}</p>
            </div>
          ))}
        </div>

        {/* ── 내부 링크(엔티티 그래프) + CTA ── */}
        <div className="mt-12 flex flex-wrap gap-3">
          <PremiumCTA href="/artists" variant="solid">
            아티스트 둘러보기
          </PremiumCTA>
          <Link
            href="/guide"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/8 px-5 py-3 text-sm font-bold text-white hover:bg-white/12"
          >
            섭외 가이드 <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <p className="mt-10 text-xs text-white/30">
          최종 업데이트: {UPDATED} · 발행: XONG(쏭) · www.xong.co.kr
        </p>
      </main>
    </div>
  );
}
