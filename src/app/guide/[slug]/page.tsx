// 가이드 아티클 — Article + FAQPage + Breadcrumb JSON-LD (AI 개요·리치결과 타깃).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "@/lib/guides";
import { SITE, absoluteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(decodeURIComponent(slug));
  if (!guide) return {};
  return {
    title: guide.metaTitle,
    description: guide.description,
    alternates: { canonical: `/guide/${guide.slug}` },
    openGraph: {
      type: "article",
      title: guide.metaTitle,
      description: guide.description,
      url: absoluteUrl(`/guide/${guide.slug}`),
      publishedTime: guide.updated,
      modifiedTime: guide.updated,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(decodeURIComponent(slug));
  if (!guide) notFound();

  const url = absoluteUrl(`/guide/${guide.slug}`);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      datePublished: guide.updated,
      dateModified: guide.updated,
      inLanguage: "ko",
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: SITE.name, url: SITE.url },
      publisher: { "@type": "Organization", name: SITE.name, url: SITE.url },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: guide.faq.map((f) => ({
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
        {
          "@type": "ListItem",
          position: 2,
          name: "섭외 가이드",
          item: absoluteUrl("/guide"),
        },
        { "@type": "ListItem", position: 3, name: guide.title, item: url },
      ],
    },
  ];

  return (
    <main className="mx-auto max-w-3xl px-5 py-14">
      <nav className="text-xs text-white/35">
        <Link href="/guide" className="hover:text-white/60">
          섭외 가이드
        </Link>
        <span className="mx-1.5">/</span>
      </nav>

      <h1 className="display-kr mt-3 text-[26px] font-black leading-snug text-white sm:text-[32px]">
        {guide.title}
      </h1>
      <p className="mt-3 text-xs text-white/35">
        XONG 리서치 · {guide.updated.replaceAll("-", ".")} 업데이트
      </p>

      {/* 인트로 — 질문에 대한 직접 답 (AI 개요 인용 타깃) */}
      <div className="mt-8 space-y-4">
        {guide.intro.map((p, i) => (
          <p
            key={i}
            className="text-[15.5px] leading-[1.85] text-white/80"
            style={{ wordBreak: "keep-all" }}
          >
            {p}
          </p>
        ))}
      </div>

      {/* 본문 섹션 */}
      {guide.sections.map((s, i) => (
        <section key={i} className="mt-11">
          {s.heading && (
            <h2 className="display-kr text-xl font-bold text-white sm:text-[22px]">
              {s.heading}
            </h2>
          )}
          {s.paragraphs?.map((p, j) => (
            <p
              key={j}
              className="mt-4 text-[15px] leading-[1.85] text-white/70"
              style={{ wordBreak: "keep-all" }}
            >
              {p}
            </p>
          ))}
          {s.table && (
            <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm" style={{ minWidth: 480 }}>
                  {s.table.caption && (
                    <caption className="bg-white/[0.03] px-4 py-2.5 text-left text-xs text-white/40">
                      {s.table.caption}
                    </caption>
                  )}
                  <thead className="bg-white/[0.03] text-xs text-white/45">
                    <tr>
                      {s.table.head.map((h, k) => (
                        <th key={k} className="px-4 py-3 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {s.table.rows.map((row, k) => (
                      <tr key={k}>
                        {row.map((cell, l) => (
                          <td
                            key={l}
                            className={
                              l === 0
                                ? "px-4 py-3 font-semibold text-white/90"
                                : "px-4 py-3 tabular-nums text-white/70"
                            }
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {s.list && (
            <ul className="mt-4 space-y-3">
              {s.list.map((item, j) => (
                <li
                  key={j}
                  className="relative pl-5 text-[15px] leading-[1.8] text-white/70"
                  style={{ wordBreak: "keep-all" }}
                >
                  <span className="absolute left-0 top-[0.72em] h-[2px] w-2.5 rounded-full bg-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="display-kr text-xl font-bold text-white sm:text-[22px]">
          자주 묻는 질문
        </h2>
        <div className="mt-5 space-y-3">
          {guide.faq.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl bg-white/[0.03] ring-1 ring-white/10"
            >
              <summary className="cursor-pointer list-none px-5 py-4 text-[15px] font-semibold text-white/90 marker:content-none">
                <span className="mr-2 text-brand-400">Q.</span>
                {f.q}
              </summary>
              <p
                className="px-5 pb-5 text-sm leading-[1.8] text-white/60"
                style={{ wordBreak: "keep-all" }}
              >
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-14 rounded-2xl bg-gradient-to-br from-brand-500/15 to-transparent p-7 text-center ring-1 ring-brand-500/25">
        <h2 className="display-kr text-lg font-bold text-white sm:text-xl">
          섭외가를 먼저 보고, 직접 문의하세요
        </h2>
        <p className="mt-2 text-sm text-white/55">
          XONG에서는 아티스트별 섭외가 범위가 공개되어 있고, 문의는 소속사 공식
          창구로 직접 전달됩니다. 매칭 수수료 0%.
        </p>
        <Link
          href="/artists"
          className="brand-glow mt-5 inline-block rounded-full bg-brand-500 px-7 py-3 text-sm font-bold text-white"
        >
          아티스트 찾아보기 →
        </Link>
      </section>

      {/* 다른 가이드 */}
      <section className="mt-12">
        <h3 className="text-sm font-bold text-white/40">다른 가이드</h3>
        <div className="mt-3 space-y-2">
          {GUIDES.filter((g) => g.slug !== guide.slug).map((g) => (
            <Link
              key={g.slug}
              href={`/guide/${g.slug}`}
              className="block text-sm text-brand-400 hover:text-brand-300"
            >
              {g.title} →
            </Link>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </main>
  );
}
