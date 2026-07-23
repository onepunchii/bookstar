// 가이드 허브 인덱스 — 정보성 콘텐츠 목록.
import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/lib/guides";
import { BOOKING_TOPICS } from "@/lib/booking-topics";
import { absoluteUrl } from "@/lib/site";
import { getT } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "연예인·인플루언서 섭외 가이드",
  description:
    "섭외 비용 시세, 대학축제 섭외 방법, 인플루언서 협업 절차 — 행사 담당자를 위한 실전 가이드 모음. 견적 거품 없이 섭외하는 법을 정리했습니다.",
  alternates: { canonical: "/guide" },
};

export default async function GuideIndexPage() {
  const { t } = await getT();
  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <p className="eyebrow text-brand-500">Guide</p>
      <h1 className="display-kr mt-3 text-3xl font-black text-white sm:text-4xl">
        {t("guide.breadcrumb")}
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/55">
        {t("guide.indexIntro")}
      </p>
      <Link
        href="/about"
        className="mt-4 inline-block text-sm font-semibold text-brand-400 hover:text-brand-300"
      >
        XONG이란? — 서비스 소개·비교·FAQ →
      </Link>

      <div className="mt-10 space-y-4">
        {GUIDES.map((g) => (
          <Link
            key={g.slug}
            href={`/guide/${g.slug}`}
            className="group block rounded-2xl bg-white/[0.03] p-6 ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:bg-white/[0.05] hover:ring-brand-500/40"
          >
            <h2 className="display-kr text-lg font-bold text-white group-hover:text-brand-300 sm:text-xl">
              {g.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              {g.description}
            </p>
            <span className="mt-3 inline-block text-xs font-semibold text-brand-400">
              {t("guide.readMore")}
            </span>
          </Link>
        ))}
      </div>

      {/* 카테고리별 섭외 — "OO 섭외" 검색 인텐트 랜딩으로 연결 */}
      <section className="mt-14">
        <h2 className="text-sm font-bold text-white/45">
          {t("guide.categoryHeading")}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {BOOKING_TOPICS.map((topic) => (
            <Link
              key={topic.slug}
              href={`/섭외/${encodeURIComponent(topic.slug)}`}
              className="rounded-full bg-white/6 px-4 py-2 text-sm font-semibold text-white/65 transition-colors hover:bg-white/10 hover:text-white"
            >
              {topic.keyword}
            </Link>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "연예인·인플루언서 섭외 가이드",
            url: absoluteUrl("/guide"),
            hasPart: GUIDES.map((g) => ({
              "@type": "Article",
              headline: g.title,
              url: absoluteUrl(`/guide/${g.slug}`),
            })),
          }),
        }}
      />
    </main>
  );
}
