import Link from "next/link";
import { HomeSearch } from "@/components/home-search";
import { LineupBundleCard } from "@/components/lineup-bundle";
import { Eyebrow } from "@/components/premium/eyebrow";
import { PremiumArtistCard } from "@/components/premium/premium-artist-card";
import { PremiumCTA } from "@/components/premium/premium-cta";
import { Reveal } from "@/components/premium/reveal";
import {
  ARTISTS,
  BOOKING_REQUESTS,
  BUNDLES,
  SCHEDULES,
  THREAD_MESSAGES,
} from "@/lib/mock-data";
import { CATEGORY_LABELS, type ArtistCategory } from "@/lib/types";
import {
  ArrowUpRight,
  CalendarCheck,
  Clock,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  const inProgress = BOOKING_REQUESTS.filter((r) =>
    ["pending", "reviewing", "negotiating"].includes(r.status)
  );
  const unread = BOOKING_REQUESTS.reduce(
    (sum, r) => sum + (r.unreadCount ?? 0),
    0
  );
  const latestMessage = THREAD_MESSAGES.filter(
    (m) => m.sender !== "system"
  ).at(-1);
  const latestRequest = latestMessage
    ? BOOKING_REQUESTS.find((r) => r.id === latestMessage.requestId)
    : undefined;
  const featured = ARTISTS.slice(0, 4);
  const fastResponders = [...ARTISTS]
    .sort((a, b) => a.responseHours - b.responseHours)
    .slice(0, 4);
  const availableThisWeek = ARTISTS.map((a) => ({
    artist: a,
    days: (SCHEDULES[a.id] ?? [])
      .slice(6, 13)
      .filter((d) => d.availability === "available").length,
  }))
    .sort((x, y) => y.days - x.days)
    .slice(0, 4);
  const avgHours =
    Math.round(
      (ARTISTS.reduce((s, a) => s + a.responseHours, 0) / ARTISTS.length) * 10
    ) / 10;
  const avgRate = Math.round(
    ARTISTS.reduce((s, a) => s + a.responseRate, 0) / ARTISTS.length
  );

  return (
    <div className="adv-dark relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-8 sm:py-10">
        {/* ── HERO ─────────────────────────────── */}
        <Reveal className="px-1 pt-2 sm:pt-4">
          <Eyebrow>광고주 콘솔</Eyebrow>
          <h1 className="display-kr mt-3 text-3xl font-black text-white sm:text-5xl">
            안녕하세요,
            <br className="sm:hidden" /> 브라이트마케팅님
          </h1>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/75">
              진행 중 {inProgress.length}건
            </span>
            <span className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/75">
              새 메시지 {unread}
            </span>
            <span className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white">
              매칭 수수료 0%
            </span>
          </div>
        </Reveal>

        {/* 검색 + AI 캐스팅 */}
        <Reveal delay={60} className="relative z-40 mt-7">
          <HomeSearch />
        </Reveal>

        {/* ── 벤토 위젯 ─────────────────────────── */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
          {/* 섭외 현황 */}
          <Reveal delay={110}>
            <Link href="/requests" className="group block h-full">
              <div className="glass glass-hover flex h-full flex-col rounded-[1.5rem] p-5">
                <div className="flex items-center justify-between">
                  <Eyebrow>진행 현황</Eyebrow>
                  <ArrowUpRight className="premium-ease h-4 w-4 text-white/30 group-hover:text-white" />
                </div>
                <p className="mt-3 text-4xl font-black text-white">
                  {inProgress.length}
                  <span className="ml-1 text-sm font-semibold text-white/40">
                    건
                  </span>
                </p>
                <p className="mt-auto pt-3 text-xs text-white/45">
                  섭외가 협의 중이에요
                </p>
              </div>
            </Link>
          </Reveal>

          {/* 새 메시지 */}
          <Reveal delay={150}>
            <Link
              href={
                latestRequest ? `/requests/${latestRequest.id}` : "/requests"
              }
              className="group block h-full"
            >
              <div className="glass glass-hover flex h-full flex-col rounded-[1.5rem] p-5">
                <div className="flex items-center justify-between">
                  <Eyebrow>
                    <MessageSquare className="h-3 w-3" /> 메시지
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
                  <p className="mt-3 text-sm text-white/40">메시지 없음</p>
                )}
              </div>
            </Link>
          </Reveal>

          {/* SLA 라이브 (풀폭) */}
          <Reveal delay={190} className="col-span-2">
            <div className="glass flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl px-5 py-3.5 text-sm">
              <span className="flex items-center gap-1.5 text-white/55">
                <Clock className="h-3.5 w-3.5 text-brand-500" /> 평균 응답{" "}
                <span className="font-black text-white">{avgHours}시간</span>
              </span>
              <span className="flex items-center gap-1.5 text-white/55">
                <TrendingUp className="h-3.5 w-3.5 text-brand-500" /> 응답률{" "}
                <span className="font-black text-white">{avgRate}%</span>
              </span>
              <span className="ml-auto flex items-center gap-1.5 text-xs text-white/45">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
                </span>
                지금 소속사 응답 중
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
                지금 섭외 가능한 아티스트
              </h2>
            </div>
            <Link
              href="/artists"
              className="premium-ease flex items-center gap-1.5 text-sm font-semibold text-white hover:text-brand-400"
            >
              전체
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

        {/* ── 세트 라인업 ───────────────────────── */}
        <section className="mt-14 sm:mt-20">
          <Reveal>
            <Eyebrow>Curated Sets</Eyebrow>
            <h2 className="display-kr mt-3 text-xl font-black text-white sm:text-3xl">
              세트로 섭외하면 더 완성도 높게
            </h2>
          </Reveal>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-3">
            {BUNDLES.map((b, i) => (
              <Reveal key={b.id} delay={i * 60}>
                <LineupBundleCard bundle={b} dark />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ── 인사이트 2열 ──────────────────────── */}
        <section className="mt-14 sm:mt-20">
          <div className="grid grid-cols-1 gap-3 sm:gap-6 md:grid-cols-2">
            <Reveal>
              <div className="glass h-full rounded-[1.5rem] p-6">
                <Eyebrow>Fast Response</Eyebrow>
                <div className="mt-4 divide-y divide-white/8">
                  {fastResponders.map((a) => (
                    <Link
                      key={a.id}
                      href={`/artists/${a.id}`}
                      className="premium-ease flex items-center justify-between py-3 text-white/80 first:pt-0 last:pb-0 hover:text-brand-400"
                    >
                      <span className="font-semibold">{a.name}</span>
                      <span className="text-sm text-white/40">
                        평균 {a.responseHours}시간
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={80}>
              <div className="glass h-full rounded-[1.5rem] p-6">
                <Eyebrow>
                  <CalendarCheck className="h-3 w-3" /> This Week
                </Eyebrow>
                <div className="mt-4 divide-y divide-white/8">
                  {availableThisWeek.map(({ artist, days }) => (
                    <Link
                      key={artist.id}
                      href={`/artists/${artist.id}`}
                      className="premium-ease flex items-center justify-between py-3 text-white/80 first:pt-0 last:pb-0 hover:text-brand-400"
                    >
                      <span className="font-semibold">{artist.name}</span>
                      <span className="text-sm font-bold text-brand-400">
                        {days}일 가능
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ── CTA 밴드 ──────────────────────────── */}
        <section className="mt-14 sm:mt-20">
          <Reveal>
            <div className="glass relative overflow-hidden rounded-[2rem] px-6 py-14 text-center sm:px-16 sm:py-20">
              <div
                aria-hidden
                className="glow-orange float-orb pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full blur-2xl"
              />
              <div className="relative">
                <Eyebrow className="justify-center">수수료 0%</Eyebrow>
                <h2 className="display-kr mx-auto mt-4 max-w-xl text-2xl font-black text-white sm:text-4xl">
                  첫 섭외 요청까지{" "}
                  <span className="text-brand-500">5분</span>이면 충분합니다
                </h2>
                <div className="mt-8 flex justify-center">
                  <PremiumCTA href="/artists" variant="solid">
                    아티스트 둘러보기
                  </PremiumCTA>
                </div>
              </div>
            </div>
          </Reveal>
        </section>
      </div>
    </div>
  );
}
