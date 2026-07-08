import { notFound } from "next/navigation";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { MomentumCard } from "@/components/momentum-card";
import { YoutubeVideos } from "@/components/youtube-videos";
import { Eyebrow } from "@/components/premium/eyebrow";
import { PremiumCTA } from "@/components/premium/premium-cta";
import { Reveal } from "@/components/premium/reveal";
import { ReviewsSection } from "@/components/reviews-section";
import { getPublicArtistBySlug, getPublicSchedule } from "@/lib/data/artists";
import { getRatingSummaryBySlug, mockIdForSlug } from "@/lib/mock-data";
import { fetchYoutubeSubscribers } from "@/lib/youtube";
import { CATEGORY_LABELS, formatBudget, formatFollowers } from "@/lib/types";
import {
  BadgeCheck,
  Clock,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // [id]는 이제 slug — DB에서 로드
  const artist = await getPublicArtistBySlug(id);
  if (!artist) notFound();
  const schedule = await getPublicSchedule(artist.id);
  const rating = getRatingSummaryBySlug(id);
  // 리뷰·모멘텀 mock 시계열은 slug→목 id로 브릿지
  const bridgeId = mockIdForSlug(id) ?? artist.id;
  const ytSubs = artist.youtube
    ? await fetchYoutubeSubscribers(artist.youtube)
    : null;
  const followerValue = ytSubs ?? artist.followers;
  const followerLabel = ytSubs ? "구독자" : "팔로워";

  return (
    <div className="adv-dark">
      {/* ── HERO ─────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div
          aria-hidden
          className="adv-orb float-orb pointer-events-none absolute -right-24 -top-20 h-96 w-96 rounded-full blur-2xl"
        />
        <div className="relative mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,340px)_1fr] lg:gap-12">
          {/* 포트레이트 */}
          <Reveal>
            <div className="adv-card relative h-64 overflow-hidden rounded-[2rem] sm:h-80 lg:h-auto lg:aspect-[4/5]">
              <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black" />
              <div
                aria-hidden
                className="adv-orb pointer-events-none absolute -right-6 top-1/3 h-48 w-48 rounded-full blur-2xl"
              />
              {artist.imageUrl ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                </>
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[9rem] font-black text-white/10">
                  {artist.name.slice(0, 1)}
                </span>
              )}
              {artist.verified && (
                <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                  <BadgeCheck className="h-3.5 w-3.5 text-brand-400" /> 인증
                  소속사
                </span>
              )}
              {rating.count > 0 && (
                <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-black/50 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">
                  <Star className="h-3 w-3 fill-brand-400 text-brand-400" />
                  {rating.avg.toFixed(1)}
                </span>
              )}
            </div>
          </Reveal>

          {/* 정보 */}
          <Reveal delay={80} className="flex flex-col justify-center">
            <Eyebrow>{artist.agencyName}</Eyebrow>
            <h1 className="display-kr mt-4 text-5xl font-black text-white sm:text-6xl">
              {artist.name}
            </h1>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-white/60">
              {artist.tagline}
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {artist.categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-bold text-brand-300"
                >
                  {CATEGORY_LABELS[c]}
                </span>
              ))}
              {artist.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-white/60"
                >
                  {t}
                </span>
              ))}
            </div>

            {/* 스탯 스트립 */}
            <div className="adv-glass mt-8 grid max-w-md grid-cols-3 divide-x divide-white/8 rounded-2xl py-4">
              {[
                {
                  icon: Users,
                  label: followerLabel,
                  value: formatFollowers(followerValue),
                },
                {
                  icon: TrendingUp,
                  label: "응답률",
                  value: `${artist.responseRate}%`,
                  accent: true,
                },
                {
                  icon: Clock,
                  label: "평균 응답",
                  value: `${artist.responseHours}h`,
                },
              ].map((s) => (
                <div key={s.label} className="px-5 text-center">
                  <s.icon className="mx-auto h-3.5 w-3.5 text-white/40" />
                  <p
                    className={`mt-1.5 text-xl font-black ${s.accent ? "text-brand-400" : "text-white"}`}
                  >
                    {s.value}
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/40">{s.label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── BODY ─────────────────────────────── */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_360px] lg:gap-14">
        {/* 좌측 콘텐츠 */}
        <div className="min-w-0 space-y-14">
          <Reveal>
            <Eyebrow className="mb-4">Momentum</Eyebrow>
            <MomentumCard
              artistId={bridgeId}
              artistName={artist.name}
              youtubeSubscribers={ytSubs}
              dark
            />
          </Reveal>

          {/* 유튜브 최근 영상 — 채널 연동 시 카드 가로 스크롤 */}
          {artist.youtube && (
            <Reveal>
              <Eyebrow className="mb-4">YouTube</Eyebrow>
              <YoutubeVideos channel={artist.youtube} dark />
            </Reveal>
          )}

          <Reveal>
            <Eyebrow className="mb-4">Recent Work</Eyebrow>
            <ul className="space-y-2.5">
              {artist.recentWork.map((work) => (
                <li
                  key={work}
                  className="adv-card flex items-center gap-3 rounded-2xl px-5 py-4 text-[15px] font-medium text-white/85"
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-brand-500" />
                  {work}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal>
            <Eyebrow className="mb-4">Reviews</Eyebrow>
            <ReviewsSection artistId={bridgeId} dark />
          </Reveal>

          <Reveal>
            <Eyebrow className="mb-4">Availability</Eyebrow>
            <div className="adv-card rounded-[1.75rem] p-6 sm:p-8">
              <AvailabilityCalendar
                days={schedule}
                monthLabel="2026년 7월"
                firstDayOffset={3}
                dark
              />
            </div>
          </Reveal>
        </div>

        {/* 우측 섭외 박스 */}
        <div>
          <div className="adv-card sticky top-6 overflow-hidden rounded-[1.75rem] p-7">
            <Eyebrow>Booking</Eyebrow>
            <p className="mt-4 text-3xl font-black tracking-tight text-white">
              {formatBudget(artist.budgetRange[0])}
              <span className="text-lg font-bold text-white/30"> ~ </span>
              {formatBudget(artist.budgetRange[1])}
            </p>
            <p className="mt-1.5 text-xs text-white/40">
              행사 유형과 조건에 따라 달라질 수 있어요
            </p>

            <div className="mt-6">
              <PremiumCTA
                href={`/booking/new?artist=${artist.slug}`}
                variant="solid"
                className="w-full justify-center"
              >
                섭외 요청하기
              </PremiumCTA>
            </div>

            <div className="mt-5 rounded-2xl bg-white/[0.04] p-4">
              <p className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Clock className="h-3.5 w-3.5 text-brand-500" />
                평균 {artist.responseHours}시간 내 응답
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
                {artist.agencyName} 담당자가 요청을 검토한 후 수락·협의·거절로
                답변드려요.
              </p>
            </div>

            <div className="mt-4 flex items-start gap-2 text-[13px] text-white/55">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
              <p>
                <span className="font-semibold text-white/85">
                  매칭 수수료 0%.
                </span>{" "}
                요청은 무료이며, 견적 확정 전까지 비용이 발생하지 않아요.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
