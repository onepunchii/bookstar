import Link from "next/link";
import { notFound } from "next/navigation";
import { MonthAvailability } from "@/components/month-availability";
import { SafetyMenu } from "@/components/safety-menu";
import { Wordmark } from "@/components/wordmark";
import {
  getArtistOwnerUserId,
  getPublicArtistBySlug,
  getPublicArtists,
  getPublicSchedule,
} from "@/lib/data/artists";
import { getSessionUser } from "@/lib/data/session";
import { getRatingSummaryBySlug } from "@/lib/mock-data";
import { YoutubeVideos } from "@/components/youtube-videos";
import { fetchYoutubeSubscribers } from "@/lib/youtube";
import { absoluteUrl, artistPublicUrl, SITE } from "@/lib/site";
import { getT } from "@/lib/i18n/server";
import { resolveArtistName } from "@/lib/profile";
import {
  buildSpecRows,
  MIN_SPEC_ROWS,
  redactArtist,
  specExtraRows,
  type ViewerType,
} from "@/lib/profile-fields";
import { SpecList } from "./spec-list";
import { CreditsTimeline } from "./credits-timeline";
import { VideoGrid } from "./video-grid";
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

  // 크롤러=ko(canonical, 한국어 색인 유지), 사람=활성 로케일. 이름은 소속사 입력 표기명 우선.
  const { t, locale } = await getT({ botDefault: "ko" });
  const name = resolveArtistName(artist, locale);
  const cat = t(`category.${artist.category}`);
  const title = t("meta.artistProfile.title", { name, cat });
  const description = t("meta.artistProfile.desc", { name });
  const url = artistPublicUrl(slug);

  return {
    title: { absolute: title },
    description,
    // 키워드는 한국어 검색어 유지(크롤러=ko) — keywords 메타는 사람 노출에 영향 없음
    keywords: [
      `${artist.name} 섭외`,
      `${artist.name} 섭외 문의`,
      `${artist.name} 섭외 견적`,
      `${CATEGORY_LABELS[artist.category]} 섭외`,
      ...artist.tags.map((tag) => `${tag} 섭외`),
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "profile",
      url,
      siteName: SITE.name,
      locale: SITE.locale,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ArtistPublicPage({ params }: PageProps) {
  // 봇은 ko 고정 — 네이버가 앵커 텍스트를 "본문 바로가기" 칩 문구로 그대로 쓰므로
  // 크롤러에게 canonical 언어(한국어) 앵커를 안정적으로 보여준다. 사람은 영향 없음.
  const { t, locale } = await getT({ botDefault: "ko" });
  const { slug } = await params;
  const raw = await getPublicArtistBySlug(slug);
  if (!raw) notFound();

  const schedule = await getPublicSchedule(raw.id);
  const rating = getRatingSummaryBySlug(slug);
  // 신고·차단(App Store 1.2) — 뷰어 로그인 여부 + 프로필 운영 유저
  // + 관련 문서(같은 공개 프로필 템플릿) 내부링크용 전체 목록
  const [viewer, ownerUserId, allArtists] = await Promise.all([
    getSessionUser(),
    getArtistOwnerUserId(raw.id),
    getPublicArtists(),
  ]);

  // 리댁션 게이트 — 비공개 필드를 여기서 지운다. 이걸 건너뛰면 비공개 체중이
  // HTML·RSC 페이로드에 그대로 실린다(UX 결함이 아니라 사고).
  // 아래 코드는 반드시 raw가 아닌 artist를 쓴다.
  const viewerType: ViewerType = viewer
    ? viewer.id === ownerUserId
      ? "owner"
      : "company"
    : "guest";
  const artist = redactArtist(raw, viewerType);
  // 관련 아티스트 — 같은 카테고리 우선, 부족하면 나머지로 채워 4~6개
  const others = allArtists.filter((a) => a.slug && a.slug !== slug);
  const relatedArtists = [
    ...others.filter((a) => a.categories.includes(artist.category)),
    ...others.filter((a) => !a.categories.includes(artist.category)),
  ].slice(0, 6);
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
    // 인물 상세 속성 — 필름메이커스가 Person 스키마에 채우는 것과 같은 축.
    // 리댁션(artist)을 거친 값만 쓴다: 비공개 필드는 구조화 데이터로도 새면 안 된다.
    ...(artist.heightCm ? { height: `${artist.heightCm} cm` } : {}),
    ...(artist.skills?.length
      ? { knowsAbout: artist.skills.map((s) => s.name) }
      : {}),
    ...(artist.languages?.length
      ? { knowsLanguage: artist.languages.map((l) => l.lang) }
      : {}),
    ...(artist.activeRegions?.length
      ? { workLocation: artist.activeRegions.map((r) => ({ "@type": "Place", name: r })) }
      : {}),
    ...((() => {
      const same = [
        instagramHref(artist.instagram),
        youtubeHref(artist.youtube),
        ...(artist.links ?? []).map((l) => l.url),
      ].filter(Boolean);
      return same.length ? { sameAs: same } : {};
    })()),
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

  // 목차 앵커 — 네이버가 페이지 안의 앵커 구조에서 "본문 바로가기" 칩을 자동 생성한다.
  // 첫 앵커는 반드시 키워드(인물명)를 포함(faqHeading = "{name} 섭외 안내" 재사용).
  // 섹션 라벨 단일 출처 — 같은 문자열을 <h2>와 목차 칩이 공유해 서로 어긋나지 않게 한다.
  // 이 문구가 네이버 검색결과 칩에 그대로 노출되므로 로케일 문구를 쓴다(영문 하드코딩 금지).
  const SECTION = {
    work: t("profile.sectionWork"),
    photos: t("profile.sectionPhotos"),
    // 고유 브랜드명 — 어떤 언어에서도 번역·음차하지 않으므로 사전 키를 두지 않는다.
    youtube: "YouTube",
    availability: t("profile.sectionAvailability"),
  } as const;
  const galleryPhotos = (artist.galleryUrls ?? []).filter(Boolean);
  const hasGallery = galleryPhotos.length > 0;

  // 스펙시트 — 값 없는 항목은 buildSpecRows가 배열에 넣지 않는다.
  // 행이 3개 미만이면 섹션째 렌더하지 않는다(3행짜리 표는 없는 것보다 초라하다).
  // 공통 스펙 + 카테고리 전용 스펙(장르·진행유형·종목 등)
  const specRows = [...buildSpecRows(artist, viewerType, t), ...specExtraRows(artist)];
  const hasSpec = specRows.length >= MIN_SPEC_ROWS;
  // 활동 이력 — 구조화 credits 우선, 없으면 레거시 recentWork 폴백.
  // 둘 다 없으면 섹션을 렌더하지 않는다(예전에는 빈 <ul>이 무조건 렌더됐다).
  const hasWork =
    (artist.credits?.length ?? 0) > 0 || artist.recentWork.length > 0;
  const hasVideos = (artist.videos?.length ?? 0) > 0;

  // 목차 칩 — 네이버가 "본문 바로가기" 칩으로 그대로 노출하는 SEO 자산이다.
  // 렌더되지 않는 섹션을 넣으면 빈 곳으로 이동시키므로, 섹션 조건과 반드시 같은 값을 쓴다.
  // 상한 6개: 아랍어·포르투갈어 라벨은 한국어의 2배 길이라 7개면 3줄로 랩된다.
  const tocItems = [
    { id: "faq", label: t("profile.faqHeading", { name: artist.name }) },
    ...(hasSpec ? [{ id: "spec", label: t("profile.spec.heading") }] : []),
    ...(hasWork ? [{ id: "work", label: SECTION.work }] : []),
    ...(hasVideos ? [{ id: "video", label: t("profile.videos.heading") }] : []),
    ...(hasGallery ? [{ id: "photos", label: SECTION.photos }] : []),
    ...(artist.youtube ? [{ id: "youtube", label: SECTION.youtube }] : []),
    { id: "availability", label: SECTION.availability },
    { id: "booking", label: t("profile.bookingCta") },
  ].slice(0, 6);

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
                  {t(`category.${c}`)}
                </span>
              ))}
              {artist.verified && (
                <span className="flex items-center gap-1 rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
                  <BadgeCheck className="h-3 w-3" /> {t("profile.verifiedAgency")}
                </span>
              )}
            </div>
            <h1 className="display-kr mt-4 text-5xl font-black tracking-tight sm:text-7xl">
              {resolveArtistName(artist, locale)}
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

      {/* 목차 앵커 — 히어로 바로 아래. RTL 대응: gap 기반 랩, 물리 마진 없음 */}
      <nav className="mx-auto mt-5 max-w-4xl px-4 sm:px-6">
        <ul className="flex flex-wrap gap-1.5">
          {tocItems.map((item) => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className="premium-ease inline-flex items-center rounded-full bg-white/8 px-3.5 py-1.5 text-xs font-semibold text-white/70 ring-1 ring-white/10 hover:text-white hover:ring-white/35"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* 통계 스트립 — 글래스 카드 */}
      <div className="mx-auto mt-5 max-w-4xl px-4 sm:px-6">
        <div className="grid grid-cols-3 divide-x divide-white/8 rounded-2xl bg-white/[0.04] py-5 ring-1 ring-white/10 backdrop-blur">
          <div className="px-4 text-center sm:px-6">
            <p className="flex items-center justify-center gap-1.5 text-xs text-white/40">
              <Users className="h-3 w-3" /> {followerLabel}
            </p>
            <p className="mt-1 text-2xl font-black sm:text-3xl">
              {formatFollowers(followerValue, locale)}
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

          {/* 프로필 스펙시트 — 광고주가 3초 안에 훑는 라벨:값 격자 */}
          {hasSpec && (
            <section id="spec" className="scroll-mt-24">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
                {t("profile.spec.heading")}
              </h2>
              <SpecList rows={specRows} lockedLabel={t("profile.spec.locked")} />
            </section>
          )}

          {/* 소개 */}
          {artist.bio && (
            <section className="scroll-mt-24">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
                {t("profile.about.heading")}
              </h2>
              <p
                className="whitespace-pre-line text-[15px] leading-[1.85] text-white/75"
                style={{ wordBreak: "keep-all" }}
              >
                {artist.bio}
              </p>
            </section>
          )}

          {/* 활동 이력 — 앵커 id는 #work 유지(외부 링크·기존 목차 호환) */}
          {hasWork && (
            <section id="work" className="scroll-mt-24">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
                {SECTION.work}
              </h2>
              <CreditsTimeline
                credits={artist.credits}
                recentWork={artist.recentWork}
                moreLabel={t("profile.credits.more", { n: 0 }).replace("0", "{n}")}
              />
            </section>
          )}

          {/* 대표 영상 */}
          {hasVideos && (
            <section id="video" className="scroll-mt-24">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
                {t("profile.videos.heading")}
              </h2>
              <VideoGrid videos={artist.videos!} />
            </section>
          )}

          {/* 갤러리 */}
          {hasGallery && (
            <section id="photos" className="scroll-mt-24">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
                {SECTION.photos}
              </h2>
              {/* 3:4 세로 비율 — 정사각 크롭은 배우·모델 전신컷의 머리·발을 잘라먹는다.
                  클릭하면 원본을 새 탭으로(라이트박스 없이 zero-JS). */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {galleryPhotos.map((url) => (
                  <a
                    key={url}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group overflow-hidden rounded-xl ring-1 ring-white/10"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`${artist.name} 사진`}
                      loading="lazy"
                      className="aspect-[3/4] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 유튜브 최근 영상 — 채널 연동 시 카드 가로 스크롤 */}
          {artist.youtube && (
            <section id="youtube" className="scroll-mt-24">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
                {SECTION.youtube}
              </h2>
              <YoutubeVideos channel={artist.youtube} dark />
            </section>
          )}

          {/* 가능 일정 */}
          <section id="availability" className="scroll-mt-24">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-wider text-white/40">
              {SECTION.availability}
            </h2>
            <div className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
              <MonthAvailability schedule={schedule} dark />
            </div>
          </section>
        </div>

        {/* 우측 CTA (모바일에선 위로) */}
        <aside id="booking" className="order-first scroll-mt-24 lg:order-last">
          <div className="sticky top-6 space-y-3 rounded-2xl bg-white/[0.05] p-6 ring-1 ring-white/10 backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-wider text-white/40">
              Booking
            </p>
            <p className="text-2xl font-black text-white">
              {formatBudget(artist.budgetRange[0], locale)}
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
      <section id="faq" className="mx-auto max-w-4xl scroll-mt-24 px-4 pb-14 sm:px-6">
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

      {/* 관련 문서 — 같은 공개 프로필 템플릿끼리 내부링크 클러스터(네이버 관련문서·크롤 경로) */}
      {relatedArtists.length > 0 && (
        <section className="mx-auto max-w-4xl px-4 pb-16 sm:px-6">
          <h2 className="display-kr text-lg font-bold text-white sm:text-xl">
            {t("booking.viewOtherArtists")}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            {relatedArtists.map((a) => (
              <Link
                key={a.id}
                href={`/@${a.slug}`}
                className="premium-ease group rounded-2xl bg-white/[0.04] p-4 ring-1 ring-white/10 hover:bg-white/[0.07] hover:ring-white/25"
              >
                <p className="text-[11px] font-semibold text-white/40">
                  {t(`category.${a.category}`)}
                </p>
                <p className="mt-1 truncate text-[15px] font-bold text-white/90 group-hover:text-white">
                  {a.name}
                </p>
                <p className="mt-0.5 truncate text-xs text-white/45">
                  {a.tagline}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

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
