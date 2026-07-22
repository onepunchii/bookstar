// 섭외 카테고리·상황 랜딩 — "OO 섭외" 검색 인텐트 대응.
// 시세표 + FAQ 스키마 + 입점 아티스트 자동 노출(해당 카테고리 있으면).
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BOOKING_TOPICS, getBookingTopic } from "@/lib/booking-topics";
import { getPublicArtists } from "@/lib/data/artists";
import { getT } from "@/lib/i18n/server";
import { SITE, absoluteUrl } from "@/lib/site";

export const dynamicParams = false;
export const revalidate = 3600;

export function generateStaticParams() {
  return BOOKING_TOPICS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const topic = getBookingTopic(decodeURIComponent(slug));
  if (!topic) return {};
  const url = absoluteUrl(`/섭외/${encodeURIComponent(topic.slug)}`);
  return {
    title: topic.title,
    description: topic.description,
    keywords: [
      topic.keyword,
      `${topic.keyword} 비용`,
      `${topic.keyword} 방법`,
      `${topic.keyword} 견적`,
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: topic.title,
      description: topic.description,
      url,
    },
  };
}

export default async function BookingTopicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { t } = await getT();
  const { slug } = await params;
  const topic = getBookingTopic(decodeURIComponent(slug));
  if (!topic) notFound();

  // 입점 아티스트 자동 노출 — 해당 카테고리 소속만, 최대 6명
  let artists: Awaited<ReturnType<typeof getPublicArtists>> = [];
  if (topic.artistCategory) {
    const all = await getPublicArtists();
    artists = all
      .filter((a) => a.categories.includes(topic.artistCategory!))
      .slice(0, 6);
  }

  const url = absoluteUrl(`/섭외/${encodeURIComponent(topic.slug)}`);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: topic.faq.map((f) => ({
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
          name: topic.keyword,
          item: url,
        },
      ],
    },
  ];

  const artistQ = topic.artistQuery
    ? `/artists?q=${encodeURIComponent(topic.artistQuery)}`
    : "/artists";

  return (
    <div className="adv-dark min-h-dvh bg-[#0a0a0b] text-white/90">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0a0a0b]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label={t("bookingTopic.homeAriaLabel")}>
            <span className="text-lg font-extrabold tracking-tight text-white">
              XO<span className="text-brand-500">NG</span>
            </span>
          </Link>
          <Link
            href={artistQ}
            className="rounded-full bg-brand-500 px-4 py-1.5 text-xs font-bold text-white brand-glow"
          >
            {t("bookingTopic.findArtist")}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-14">
        <p className="eyebrow text-brand-500">{t("bookingTopic.eyebrow")}</p>
        <h1 className="display-kr mt-3 text-3xl font-black text-white sm:text-4xl">
          {topic.keyword}
        </h1>

        <div className="mt-7 space-y-4">
          {topic.intro.map((p, i) => (
            <p
              key={i}
              className="text-[15.5px] leading-[1.85] text-white/80"
              style={{ wordBreak: "keep-all" }}
            >
              {p}
            </p>
          ))}
        </div>

        {/* 시세표 */}
        <section className="mt-11">
          <h2 className="display-kr text-xl font-bold text-white sm:text-[22px]">
            {t("bookingTopic.priceRangeTitle", { keyword: topic.keyword })}
          </h2>
          <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-white/10">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" style={{ minWidth: 440 }}>
                {topic.priceCaption && (
                  <caption className="bg-white/[0.03] px-4 py-2.5 text-left text-xs text-white/40">
                    {topic.priceCaption}
                  </caption>
                )}
                <thead className="bg-white/[0.03] text-xs text-white/45">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t("bookingTopic.tableCategory")}</th>
                    <th className="px-4 py-3 font-semibold">{t("bookingTopic.tableRange")}</th>
                    <th className="px-4 py-3 font-semibold">{t("bookingTopic.tableNote")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.06]">
                  {topic.priceRows.map((row, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 font-semibold text-white/90">
                        {row[0]}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-white/70">
                        {row[1]}
                      </td>
                      <td className="px-4 py-3 text-white/55">{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="mt-2.5 text-xs text-white/35">
            {t("bookingTopic.priceDisclaimer")}
          </p>
        </section>

        {/* 입점 아티스트 (있으면) */}
        {artists.length > 0 && (
          <section className="mt-11">
            <h2 className="display-kr text-xl font-bold text-white sm:text-[22px]">
              {t("bookingTopic.availableNow", {
                keyword: topic.keyword.replace(" 섭외", ""),
              })}
            </h2>
            <p className="mt-2 text-sm text-white/50">
              {t("bookingTopic.availableNowDesc")}
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {artists.map((a) => (
                <Link
                  key={a.id}
                  href={`/@${a.slug}`}
                  className="group overflow-hidden rounded-2xl bg-white/[0.03] ring-1 ring-white/10 transition-all hover:-translate-y-0.5 hover:ring-brand-500/40"
                >
                  <div className="relative aspect-[4/5] bg-white/5">
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={a.imageUrl}
                        alt={t("bookingTopic.artistAlt", { name: a.name })}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-2xl font-black text-white/15">
                        {a.name.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="text-sm font-bold text-white group-hover:text-brand-300">
                      {a.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-white/45">
                      {a.agencyName}
                    </div>
                    {a.budgetRange[0] > 0 && (
                      <div className="mt-1.5 text-xs font-semibold text-brand-400">
                        {t("bookingTopic.budgetRange", {
                          min: a.budgetRange[0].toLocaleString(),
                          max: a.budgetRange[1].toLocaleString(),
                        })}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href={artistQ}
              className="mt-5 inline-block text-sm font-semibold text-brand-400 hover:text-brand-300"
            >
              {t("bookingTopic.viewAll")}
            </Link>
          </section>
        )}

        {/* 체크리스트 */}
        <section className="mt-11">
          <h2 className="display-kr text-xl font-bold text-white sm:text-[22px]">
            {topic.tips.heading}
          </h2>
          <ul className="mt-4 space-y-3">
            {topic.tips.items.map((item, i) => (
              <li
                key={i}
                className="relative pl-5 text-[15px] leading-[1.8] text-white/70"
                style={{ wordBreak: "keep-all" }}
              >
                <span className="absolute left-0 top-[0.72em] h-[2px] w-2.5 rounded-full bg-brand-500" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mt-12">
          <h2 className="display-kr text-xl font-bold text-white sm:text-[22px]">
            {t("bookingTopic.faqTitle")}
          </h2>
          <div className="mt-5 space-y-3">
            {topic.faq.map((f, i) => (
              <details
                key={i}
                className="group rounded-2xl bg-white/[0.03] ring-1 ring-white/10"
              >
                <summary className="cursor-pointer list-none px-5 py-4 text-[15px] font-semibold text-white/90 marker:content-none">
                  <span className="mr-2 text-brand-400">{t("bookingTopic.faqQMarker")}</span>
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
            {t("bookingTopic.ctaTitle", { keyword: topic.keyword })}
          </h2>
          <p className="mt-2 text-sm text-white/55">
            {t("bookingTopic.ctaDesc")}
          </p>
          <Link
            href={artistQ}
            className="brand-glow mt-5 inline-block rounded-full bg-brand-500 px-7 py-3 text-sm font-bold text-white"
          >
            {t("bookingTopic.ctaButton")}
          </Link>
        </section>

        {/* 다른 카테고리 */}
        <section className="mt-12">
          <h3 className="text-sm font-bold text-white/40">{t("bookingTopic.otherCategories")}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {BOOKING_TOPICS.filter((item) => item.slug !== topic.slug).map((item) => (
              <Link
                key={item.slug}
                href={`/섭외/${encodeURIComponent(item.slug)}`}
                className="rounded-full bg-white/6 px-3.5 py-1.5 text-xs font-semibold text-white/60 hover:bg-white/10 hover:text-white"
              >
                {item.keyword}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-xs text-white/35">
          <span>{t("bookingTopic.footerTagline")}</span>
          <Link href="/guide" className="hover:text-white/70">
            {t("bookingTopic.footerGuideLink")}
          </Link>
        </div>
      </footer>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
