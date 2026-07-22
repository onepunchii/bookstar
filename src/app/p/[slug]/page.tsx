import Link from "next/link";
import { notFound } from "next/navigation";
import { MonthAvailability } from "@/components/month-availability";
import { SafetyMenu } from "@/components/safety-menu";
import { Wordmark } from "@/components/wordmark";
import {
  getArtistOwnerUserId,
  getPublicArtistBySlug,
  getPublicSchedule,
} from "@/lib/data/artists";
import { getSessionUser } from "@/lib/data/session";
import { getRatingSummaryBySlug } from "@/lib/mock-data";
import { YoutubeVideos } from "@/components/youtube-videos";
import { fetchYoutubeSubscribers } from "@/lib/youtube";
import { absoluteUrl, artistPublicUrl, SITE } from "@/lib/site";
import { getT } from "@/lib/i18n/server";
import { ShareButton } from "./share-button";

// SNS 입력(@핸들 또는 URL) → 실제 링크
function instagramHref(v?: string): string | null {
  if (!v) return null;
  return v.startsWith("http")
    ? v
    : `https://instagram.com/${v.replace(/^@/, "")}`;
}
function youtubeHref(v?: string): string | null {
  if (!v) return null;
  return v.startsWith("http")
    ? v
    : `https://youtube.com/${v.startsWith("@") ? v : `@${v}`}`;
}
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
  const { t } = await getT();
  const { slug } = await params;
  const artist = await getPublicArtistBySlug(slug);
  if (!artist) notFound();

  const schedule = await getPublicSchedule(artist.id);
  const rating = getRatingSummaryBySlug(slug);
  // 신고·차단(App Store 1.2) — 뷰어 로그인 여부 + 프로필 운영 유저
  const [viewer, ownerUserId] = await Promise.all([
    getSessionUser(),
    getArtistOwnerUserId(artist.id),
  ]);
  // 유튜브 채널이 있으면 실 구독자 수, 없으면 저장된 팔로워
  const ytSubs = artist.youtube
    ? await fetchYoutubeSubscribers(artist.youtube)
    : null;
  const followerValue = ytSubs ?? artist.followers;
  const followerLabel = ytSubs ? t("profile.subscribers") : t("profile.followers");
  const instagramUrl = instagramHref(artist.instagram);
  const youtubeUrl = youtubeHref(artist.youtube);

  // 구조화 데이터 (Schema.org) — 검색 리치결과
  const isGroup = artist.gender === "group";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": isGroup ? "PerformingGroup" : "Person",
    name: artist.name,
    description: artist.tagline,
    url: artistPublicUrl(slug),
    ...(artist.imageUrl ? { image: absoluteUrl(artist.imageUrl) } : {}),
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

  // "{이름} 섭외" 검색 인텐트용 FAQ — 스키마와 하단 보이는 섹션이 같은 내용을 공유
  const [budgetMin, budgetMax] = artist.budgetRange;
  const budgetAnswer =
    budgetMin > 0 && budgetMax > 0
      ? `${artist.name} 섭외가는 ${budgetMin.toLocaleString()}만~${budgetMax.toLocaleString()}만 원 범위이며, 행사 성격·일정·지역에 따라 달라집니다. 정확한 견적은 예산과 날짜를 적어 문의하면 소속사 공식 창구가 직접 회신합니다.`
      : `${artist.name} 섭외가는 행사 성격·일정·지역에 따라 달라집니다. 예산과 날짜를 적어 문의하면 소속사 공식 창구가 직접 회신합니다.`;
  const bookingFaq = [
    { q: `${artist.name} 섭외 비용은 얼마인가요?`, a: budgetAnswer },
    {
      q: `${artist.name} 섭외는 어떻게 문의하나요?`,
      a: `이 페이지의 섭외 요청 버튼으로 행사 개요·예산·날짜를 보내면 ${artist.agencyName} 공식 창구에 바로 전달됩니다. 중간 대행 없이 직접 협의하며, xong의 매칭 수수료는 0%입니다.`,
    },
    {
      q: `답변은 얼마나 걸리나요?`,
      a: `${artist.name} 소속사의 평균 응답 시간은 약 ${artist.responseHours}시간입니다. 문의에 예산·날짜가 명확할수록 회신이 빠릅니다.`,
    },
  ];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: bookingFaq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#0a0a0b] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* 상단 얇은 브랜드 바 — 히어로 위에 오버레이 */}
      <div className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-5 sm:px-6">
          <Link href="/" aria-label={t("profile.homeAria")}>
            <Wordmark height={18} />
          </Link>
          <div className="flex items-center gap-1">
            <span className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-semibold text-white/60 backdrop-blur">
              {t("profile.publicBadge")}
            </span>
            <SafetyMenu
              targetType="artist_profile"
              targetId={artist.id}
              targetUserId={
                ownerUserId && ownerUserId !== viewer?.id ? ownerUserId : null
              }
              loggedIn={!!viewer}
              dark
            />
          </div>
        </div>
      </div>

      {/* 풀블리드 히어로 — 아티스트 사진이 화면을 채움 */}
      <section className="relative h-[62vh] min-h-[440px] w-full overflow-hidden sm:h-[68vh] sm:max-h-[720px]">
        {artist.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={artist.imageUrl}
            alt={t("profile.photoAlt", { name: artist.name })}
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/25 via-[#141416] to-black">
            <span className="absolute inset-0 flex items-center justify-center text-[10rem] font-black text-white/10 sm:text-[16rem]">
              {artist.name.slice(0, 1)}
            </span>
          </div>
        )}
        {/* 아래로 갈수록 페이지 배경에 녹아드는 그라디언트 */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/35 to-black/25" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-brand-500/20 blur-3xl"
        />

        {/* 히어로 하단 정보 */}
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-4xl px-5 pb-7 sm:px-6 sm:pb-10">
            <div className="flex flex-wrap items-center gap-2">
              {artist.categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
                >
                  {CATEGORY_LABELS[c]}
                </span>
              ))}
              {artist.verified && (
                <span className="flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                  <BadgeCheck className="h-3 w-3" /> {t("profile.verifiedAgency")}
                </span>
              )}
            </div>
            <h1 className="display-kr mt-4 text-5xl font-black tracking-tight sm:text-7xl">
              {artist.name}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
              {artist.tagline}
            </p>
            <p className="mt-3 text-sm text-white/45">
              {t("profile.affiliation")}{" "}
              <span className="text-white/75">{artist.agencyName}</span>
            </p>
          </div>
        </div>
      </section>

      {/* 통계 스트립 — 글래스 카드 */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="grid grid-cols-3 divide-x divide-white/8 rounded-2xl bg-white/[0.04] py-5 ring-1 ring-white/10 backdrop-blur">
          <div className="px-4 text-center sm:px-6">
            <p className="flex items-center justify-center gap-1.5 text-xs text-white/40">
              <Users className="h-3 w-3" /> {followerLabel}
            </p>
            <p className="mt-1 text-2xl font-black sm:text-3xl">
              {formatFollowers(followerValue)}
            </p>
          </div>
          <div className="px-4 text-center sm:px-6">
            <p className="flex items-center justify-center gap-1.5 text-xs text-white/40">
              <TrendingUp className="h-3 w-3" /> {t("profile.responseRate")}
            </p>
            <p className="mt-1 text-2xl font-black text-brand-400 sm:text-3xl">
              {artist.responseRate}%
            </p>
          </div>
          <div className="px-4 text-center sm:px-6">
            <p className="flex items-center justify-center gap-1.5 text-xs text-white/40">
              <Clock className="h-3 w-3" /> {t("profile.avgResponse")}
            </p>
            <p className="mt-1 text-2xl font-black sm:text-3xl">
              {artist.responseHours}
              <span className="ml-1 text-lg font-bold text-white/40">
                {t("profile.hoursUnit")}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="mx-auto grid max-w-4xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-3">
        {/* 좌측 컨텐츠 */}
        <div className="min-w-0 space-y-10 lg:col-span-2">
          {/* 태그 */}
          {artist.tags.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-white/40">
                Tag
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {artist.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 최근 활동 */}
          <section>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
              Recent Work
            </h2>
            <ul className="space-y-2.5">
              {artist.recentWork.map((work) => (
                <li
                  key={work}
                  className="flex items-start gap-3 rounded-xl bg-white/[0.04] p-4 text-sm ring-1 ring-white/8"
                >
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  <span className="leading-relaxed text-white/80">
                    {work}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* 갤러리 */}
          {artist.galleryUrls && artist.galleryUrls.some(Boolean) && (
            <section>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
                Photos
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {artist.galleryUrls.filter(Boolean).map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={url}
                    alt={`${artist.name} 사진`}
                    className="aspect-square w-full rounded-xl object-cover ring-1 ring-white/10"
                  />
                ))}
              </div>
            </section>
          )}

          {/* 유튜브 최근 영상 — 채널 연동 시 카드 가로 스크롤 */}
          {artist.youtube && (
            <section>
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
                YouTube
              </h2>
              <YoutubeVideos channel={artist.youtube} dark />
            </section>
          )}

          {/* 가능 일정 */}
          <section>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
              Availability
            </h2>
            <div className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
              <MonthAvailability schedule={schedule} dark />
            </div>
          </section>
        </div>

        {/* 우측 CTA (모바일에선 위로) */}
        <aside className="order-first lg:order-last">
          <div className="sticky top-6 space-y-3 rounded-2xl bg-white/[0.05] p-6 ring-1 ring-white/10 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">
              Booking
            </p>
            <p className="text-2xl font-black text-white">
              {formatBudget(artist.budgetRange[0])}
              <span className="text-base font-bold text-white/40">~</span>
            </p>
            <p className="text-xs text-white/45">
              {t("profile.budgetNote")}
            </p>

            <Link
              href={`/booking/new?artist=${artist.slug}`}
              className="premium-ease mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white hover:bg-brand-600"
            >
              <MessageSquare className="h-4 w-4" />
              {t("profile.bookingCta")}
            </Link>
            <p className="text-center text-[11px] text-white/40">
              {t("profile.feeNote", { n: artist.responseHours })}
            </p>

            <div className="my-4 h-px bg-white/10" />

            <p className="text-xs font-bold uppercase tracking-wider text-white/40">
              Follow
            </p>
            <div className="flex gap-2">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex h-10 flex-1 items-center justify-center rounded-lg ring-1 ring-white/15 text-white/60 transition-colors hover:text-white hover:ring-white/40"
                >
                  <InstagramIcon className="h-4 w-4" />
                </a>
              )}
              {youtubeUrl && (
                <a
                  href={youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="flex h-10 flex-1 items-center justify-center rounded-lg ring-1 ring-white/15 text-white/60 transition-colors hover:text-white hover:ring-white/40"
                >
                  <YoutubeIcon className="h-4 w-4" />
                </a>
              )}
              <ShareButton url={artistPublicUrl(slug)} />
            </div>
          </div>
        </aside>
      </div>

      {/* 섭외 안내 FAQ — "{이름} 섭외" 검색 인텐트 대응 (스키마와 동일 내용) */}
      <section className="mx-auto max-w-4xl px-4 pb-14 sm:px-6">
        <h2 className="display-kr text-lg font-bold text-white sm:text-xl">
          {t("profile.faqHeading", { name: artist.name })}
        </h2>
        <div className="mt-4 space-y-2.5">
          {bookingFaq.map((f, i) => (
            <details
              key={i}
              className="group rounded-2xl bg-white/[0.03] ring-1 ring-white/10"
            >
              <summary className="cursor-pointer list-none px-5 py-3.5 text-[15px] font-semibold text-white/90 marker:content-none">
                <span className="mr-2 text-brand-400">Q.</span>
                {f.q}
              </summary>
              <p
                className="px-5 pb-4 text-sm leading-[1.8] text-white/60"
                style={{ wordBreak: "keep-all" }}
              >
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 푸터 */}
      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-2 px-4 py-6 text-xs text-white/35 sm:flex-row sm:items-center sm:px-6">
          <p>
            {t("profile.footerPre")}{" "}
            <Link href="/" className="font-semibold text-white/80">
              xong
            </Link>
            {t("profile.footerPost")}
          </p>
          <p>xong.co.kr/@{artist.slug}</p>
        </div>
      </footer>
    </div>
  );
}
