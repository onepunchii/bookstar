import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { FeedbackBox } from "@/components/feedback-box";
import { HomeSearch } from "@/components/home-search";
import { LineupBundleCard } from "@/components/lineup-bundle";
import { LiveSignal } from "@/components/live-signal";
import { Eyebrow } from "@/components/premium/eyebrow";
import { PremiumArtistCard } from "@/components/premium/premium-artist-card";
import { PremiumCTA } from "@/components/premium/premium-cta";
import { Reveal } from "@/components/premium/reveal";
import { getPublicArtists } from "@/lib/data/artists";
import { getBookingRequests } from "@/lib/data/booking-requests";
import { getPublicBundles } from "@/lib/data/bundles";
import { getCompanyCampaigns } from "@/lib/data/campaigns";
import { getSessionUser } from "@/lib/data/session";
import { getMessages } from "@/lib/data/messages";
import { getT } from "@/lib/i18n/server";
import { type ArtistCategory } from "@/lib/types";
import {
  ArrowUpRight,
  Clock,
  Megaphone,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

// 홈 self-canonical (루트 canonical 제거에 따라 명시)
export const metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const { t } = await getT();
  const user = await getSessionUser();
  const [ARTISTS, BOOKING_REQUESTS, bundles] = await Promise.all([
    getPublicArtists(),
    getBookingRequests(user ? { companyUserId: user.id } : undefined),
    getPublicBundles(),
  ]);
  const inProgress = BOOKING_REQUESTS.filter((r) =>
    ["pending", "reviewing", "negotiating"].includes(r.status)
  );
  const unread = BOOKING_REQUESTS.filter(
    (r) => r.status === "negotiating"
  ).length;
  const latestRequest = BOOKING_REQUESTS.find(
    (r) => r.status === "negotiating"
  );
  const latestMessage = latestRequest
    ? (await getMessages(latestRequest.id))
        .filter((m) => m.sender !== "system")
        .at(-1)
    : undefined;
  const featured = ARTISTS.slice(0, 4);
  const avgHours =
    Math.round(
      (ARTISTS.reduce((s, a) => s + a.responseHours, 0) / ARTISTS.length) * 10
    ) / 10;
  const avgRate = Math.round(
    ARTISTS.reduce((s, a) => s + a.responseRate, 0) / ARTISTS.length
  );
  // 내 오픈 캠페인 요약 (로그인 광고주)
  const myCampaigns = user ? await getCompanyCampaigns(user.id) : [];
  const openMine = myCampaigns.filter((c) => c.status === "open").length;
  const myApplicants = myCampaigns.reduce((s, c) => s + c.applicantCount, 0);

  return (
    <div className="adv-dark relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        {/* ── HERO (이미지 배경이 인사말+검색바까지 덮음) ── */}
        <div className="relative">
          {/* 콘서트 이미지 — 오른쪽에서 크게 번지고, 검색바 아래까지 세로로 */}
          <div className="pointer-events-none absolute bottom-0 right-[-1rem] top-[-1.5rem] w-[72%] overflow-hidden sm:right-[-2rem] sm:w-[56%]">
            <Image
              src="/hero-concert.webp"
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 72vw, 680px"
              className="object-cover object-[center_30%]"
            />
            {/* 좌→우 다크 그라디언트 (왼쪽 텍스트 가독성) */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b] via-[#0a0a0b]/70 to-[#0a0a0b]/5" />
            {/* 상·하 페이드 */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#0a0a0b] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/50 to-transparent" />
          </div>

          {/* 텍스트 */}
          <Reveal className="relative max-w-[70%] px-1 pb-6 pt-6 sm:max-w-md sm:pt-12">
            <Eyebrow>{t("home.eyebrowConsole")}</Eyebrow>
            <h1 className="display-kr mt-3 text-3xl font-black text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.6)] sm:text-5xl">
              {t("home.greetingHello")}
              <br />{" "}
              {t("home.greetingName", {
                name: user?.name ?? t("home.demoCompany"),
              })}
            </h1>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white">
                {t("home.matchingFeeZero")}
              </span>
            </div>
          </Reveal>

          {/* 검색 + AI 캐스팅 — 사진 위에 뜨는 유리바 */}
          <Reveal delay={60} className="relative z-40 mt-8 pb-2 sm:mt-10">
            <HomeSearch artists={ARTISTS} />
          </Reveal>
        </div>

        {/* 내 오픈 캠페인 바로가기 — 진행 중일 때만 */}
        {myCampaigns.length > 0 && (
          <Reveal delay={90} className="mt-6">
            <Link
              href="/requests/campaigns"
              className="adv-card adv-card-hover flex items-center gap-4 rounded-2xl p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
                <Megaphone className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-black text-white">
                  {t("home.myOpenCampaigns", { count: openMine })}
                </p>
                <p className="text-sm text-white/50">
                  {t("home.myApplicantsHint", { count: myApplicants })}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-white/30" />
            </Link>
          </Reveal>
        )}

        {/* ── 벤토 위젯 ─────────────────────────── */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
          {/* 섭외 현황 */}
          <Reveal delay={110}>
            <Link href="/requests" className="group block h-full">
              <div className="glass glass-hover flex h-full flex-col rounded-[1.5rem] p-5">
                <div className="flex items-center justify-between">
                  <Eyebrow>{t("home.progressStatus")}</Eyebrow>
                  <ArrowUpRight className="premium-ease h-4 w-4 text-white/30 group-hover:text-white" />
                </div>
                <p className="mt-3 text-4xl font-black text-white">
                  {inProgress.length}
                  <span className="ml-1 text-sm font-semibold text-white/40">
                    {t("home.unitCount")}
                  </span>
                </p>
                <p className="mt-auto pt-3 text-xs text-white/45">
                  {t("home.inProgressHint")}
                </p>
              </div>
            </Link>
          </Reveal>

          {/* 새 메시지 */}
          <Reveal delay={150}>
            <Link
              href={
                latestRequest && user
                  ? `/requests/${latestRequest.id}`
                  : "/requests"
              }
              className="group block h-full"
            >
              <div className="glass glass-hover flex h-full flex-col rounded-[1.5rem] p-5">
                <div className="flex items-center justify-between">
                  <Eyebrow>
                    <MessageSquare className="h-3 w-3" /> {t("home.messages")}
                  </Eyebrow>
                  {unread > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                      {unread}
                    </span>
                  )}
                </div>
                {latestMessage ? (
                  <p className="mt-3 line-clamp-3 text-[13px] font-medium leading-relaxed text-white/80">
                    &ldquo;{latestMessage.body}&rdquo;
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-white/40">
                    {t("home.noMessage")}
                  </p>
                )}
              </div>
            </Link>
          </Reveal>

          {/* SLA 라이브 (풀폭) */}
          <Reveal delay={190} className="col-span-2">
            <div className="glass flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-5 py-3.5 text-sm">
              <span className="flex items-center gap-1.5 text-white/55">
                <Clock className="h-3.5 w-3.5 text-brand-500" />{" "}
                {t("home.avgResponse")}{" "}
                <span className="font-black text-white">
                  {t("home.hoursValue", { hours: avgHours })}
                </span>
              </span>
              <span className="flex items-center gap-1.5 text-white/55">
                <TrendingUp className="h-3.5 w-3.5 text-brand-500" />{" "}
                {t("home.responseRate")}{" "}
                <span className="font-black text-white">{avgRate}%</span>
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-white/45">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                </span>
                {t("home.liveAgencyResponding")}
              </span>
            </div>
          </Reveal>
        </div>

        {/* ── FEATURED ─────────────────────────── */}
        <section className="mt-14 sm:mt-20">
          <Reveal className="flex items-end justify-between">
            <div>
              <Eyebrow>Featured</Eyebrow>
              <h2 className="display-kr mt-3 text-xl font-black text-white sm:text-3xl">
                {t("home.featuredTitle")}
              </h2>
            </div>
            <Link
              href="/artists"
              className="premium-ease flex items-center gap-1.5 text-sm font-semibold text-white hover:text-brand-400"
            >
              {t("home.viewAll")}
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {featured.map((artist, i) => (
              <Reveal key={artist.id} delay={i * 60}>
                <PremiumArtistCard artist={artist} />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 세트 라인업 (실 번들) ───────────────── */}
        {bundles.length > 0 && (
          <section className="mt-14 sm:mt-20">
            <Reveal>
              <Eyebrow>Curated Sets</Eyebrow>
              <h2 className="display-kr mt-3 text-xl font-black text-white sm:text-3xl">
                {t("home.curatedTitle")}
              </h2>
            </Reveal>
            <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-3">
              {bundles.map((b, i) => (
                <Reveal key={b.id} delay={i * 60}>
                  <LineupBundleCard bundle={b} dark />
                </Reveal>
              ))}
            </div>
          </section>
        )}

        {/* ── 라이브 시그널 — 네이버·유튜브 실측 화제성 (실데이터 없으면 미노출) ── */}
        <Suspense fallback={null}>
          <LiveSignal artists={ARTISTS} />
        </Suspense>

        {/* ── CTA 밴드 ──────────────────────────── */}
        <section className="mt-14 sm:mt-20">
          <Reveal>
            <div className="glass relative overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-16 sm:py-20">
              <div
                aria-hidden
                className="glow-orange float-orb pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full blur-2xl"
              />
              <div className="relative">
                <Eyebrow className="justify-center">{t("home.zeroFee")}</Eyebrow>
                <h2 className="display-kr mx-auto mt-4 max-w-xl text-2xl font-black text-white sm:text-4xl">
                  {t("home.ctaTitlePre")}{" "}
                  <span className="text-brand-500">{t("home.ctaMinutes")}</span>
                  {t("home.ctaTitlePost")}
                </h2>
                <div className="mt-8 flex justify-center">
                  <PremiumCTA href="/artists" variant="solid">
                    {t("home.browseArtists")}
                  </PremiumCTA>
                </div>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ── 건의함 — 제휴·버그·개선 (최하단) ── */}
        <section className="mt-14 sm:mt-20">
          <Reveal>
            <FeedbackBox role="company" dark />
          </Reveal>
        </section>
      </div>
    </div>
  );
}
