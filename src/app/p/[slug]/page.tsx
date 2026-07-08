import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { Wordmark } from "@/components/wordmark";
import { Badge } from "@/components/ui/badge";
import { getPublicArtistBySlug, getPublicSchedule } from "@/lib/data/artists";
import { getRatingSummaryBySlug } from "@/lib/mock-data";
import { artistPublicUrl, SITE } from "@/lib/site";
import {
  CATEGORY_LABELS,
  formatBudget,
  formatFollowers,
} from "@/lib/types";
import type { Metadata } from "next";
import {
  BadgeCheck,
  Clock,
  MessageSquare,
  Share2,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getPublicArtistBySlug(slug);
  if (!artist) return { title: "아티스트를 찾을 수 없어요" };

  const cat = CATEGORY_LABELS[artist.category];
  const title = `${artist.name} 섭외 · ${cat}`;
  const description = `${artist.tagline} · ${artist.agencyName} 소속. ${artist.name} 섭외 문의는 xong에서 — 매칭 수수료 0%, 평균 ${artist.responseHours}시간 내 응답.`;
  const url = artistPublicUrl(slug);

  return {
    title,
    description,
    keywords: [
      `${artist.name} 섭외`,
      `${artist.name} 섭외 문의`,
      `${artist.name} 섭외 견적`,
      `${cat} 섭외`,
      ...artist.tags.map((t) => `${t} 섭외`),
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      title: `${artist.name} 섭외 문의 · xong`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${artist.name} 섭외 문의 · xong`,
      description,
    },
  };
}

export default async function ArtistPublicPage({ params }: PageProps) {
  const { slug } = await params;
  const artist = await getPublicArtistBySlug(slug);
  if (!artist) notFound();

  const schedule = await getPublicSchedule(artist.id);
  const rating = getRatingSummaryBySlug(slug);

  // 구조화 데이터 (Schema.org) — 검색 리치결과
  const isGroup = artist.gender === "group";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isGroup ? "PerformingGroup" : "Person",
    name: artist.name,
    description: artist.tagline,
    url: artistPublicUrl(slug),
    ...(artist.imageUrl ? { image: `${SITE.url}${artist.imageUrl}` } : {}),
    jobTitle: CATEGORY_LABELS[artist.category],
    worksFor: { "@type": "Organization", name: artist.agencyName },
    ...(rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.avg,
            reviewCount: rating.count,
            bestRating: 5,
          },
        }
      : {}),
  };

  return (
    <div className="min-h-dvh bg-neutral-50">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 상단 얇은 브랜드 바 */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="xong 홈으로">
            <Wordmark height={18} />
          </Link>
          <span className="text-xs text-neutral-400">공개 프로필</span>
        </div>
      </div>

      {/* 히어로 */}
      <section className="relative overflow-hidden bg-neutral-950 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-center">
            {/* 사진 자리 (아직 사진 없으면 그라디언트 이니셜) */}
            <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-500 to-brand-700 text-5xl font-black text-white shadow-2xl shadow-brand-500/30 sm:h-40 sm:w-40 sm:text-6xl">
              {artist.name.slice(0, 1)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {artist.categories.map((c) => (
                  <span
                    key={c}
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
                  >
                    {CATEGORY_LABELS[c]}
                  </span>
                ))}
                {artist.verified && (
                  <span className="flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                    <BadgeCheck className="h-3 w-3" /> 인증 소속사
                  </span>
                )}
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
                {artist.name}
              </h1>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-neutral-300 sm:text-lg">
                {artist.tagline}
              </p>
              <p className="mt-4 text-sm text-neutral-500">
                소속:{" "}
                <span className="text-neutral-300">{artist.agencyName}</span>
              </p>
            </div>
          </div>

          {/* 통계 스트립 */}
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8 sm:gap-8">
            <div>
              <p className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Users className="h-3 w-3" /> 팔로워
              </p>
              <p className="mt-1 text-2xl font-black sm:text-3xl">
                {formatFollowers(artist.followers)}
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs text-neutral-400">
                <TrendingUp className="h-3 w-3" /> 응답률
              </p>
              <p className="mt-1 text-2xl font-black text-brand-400 sm:text-3xl">
                {artist.responseRate}%
              </p>
            </div>
            <div>
              <p className="flex items-center gap-1.5 text-xs text-neutral-400">
                <Clock className="h-3 w-3" /> 평균 응답
              </p>
              <p className="mt-1 text-2xl font-black sm:text-3xl">
                {artist.responseHours}
                <span className="ml-1 text-lg font-bold text-neutral-500">
                  시간
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 본문 */}
      <div className="mx-auto grid max-w-4xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3">
        {/* 좌측 컨텐츠 */}
        <div className="space-y-10 lg:col-span-2">
          {/* 태그 */}
          {artist.tags.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-neutral-500">
                Tag
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {artist.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </section>
          )}

          {/* 최근 활동 */}
          <section>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
              Recent Work
            </h2>
            <ul className="space-y-2.5">
              {artist.recentWork.map((work) => (
                <li
                  key={work}
                  className="flex items-start gap-3 rounded-xl bg-white p-4 text-sm shadow-sm ring-1 ring-neutral-200/70"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <span className="leading-relaxed text-neutral-700">
                    {work}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* 가능 일정 */}
          <section>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-neutral-500">
              Availability
            </h2>
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/70">
              <AvailabilityCalendar
                days={schedule}
                monthLabel="2026년 7월"
                firstDayOffset={3}
              />
            </div>
          </section>
        </div>

        {/* 우측 CTA (모바일에선 위로) */}
        <aside className="order-first lg:order-last">
          <div className="sticky top-6 space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200/70">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Booking
            </p>
            <p className="text-2xl font-black">
              {formatBudget(artist.budgetRange[0])}
              <span className="text-base font-bold text-neutral-400">~</span>
            </p>
            <p className="text-xs text-neutral-500">
              행사 유형과 조건에 따라 달라져요
            </p>

            <button
              type="button"
              disabled
              className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white opacity-60"
            >
              <MessageSquare className="h-4 w-4" />
              섭외 문의하기
            </button>
            <p className="text-center text-[11px] text-neutral-400">
              문의 폼은 다음 업데이트에서 오픈돼요
            </p>

            <div className="my-4 h-px bg-neutral-100" />

            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Follow
            </p>
            <div className="flex gap-2">
              <a
                href="#"
                aria-label="Instagram"
                className="flex h-10 flex-1 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="YouTube"
                className="flex h-10 flex-1 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
              >
                <YoutubeIcon className="h-4 w-4" />
              </a>
              <button
                aria-label="공유"
                className="flex h-10 flex-1 items-center justify-center rounded-lg border border-neutral-200 text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
              >
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* 푸터 */}
      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-neutral-400 sm:flex-row sm:items-center sm:px-6">
          <p>
            이 페이지는{" "}
            <Link href="/" className="font-semibold text-neutral-900">
              xong
            </Link>
            에서 발행됐어요 · 검증된 소속사의 공식 섭외 창구
          </p>
          <p>xong.co.kr/@{artist.slug}</p>
        </div>
      </footer>
    </div>
  );
}
