import Link from "next/link";
import { LineupBundleCard } from "@/components/lineup-bundle";
import { Eyebrow } from "@/components/premium/eyebrow";
import { PremiumArtistCard } from "@/components/premium/premium-artist-card";
import { PremiumCTA } from "@/components/premium/premium-cta";
import { Reveal } from "@/components/premium/reveal";
import { SLACounter } from "@/components/sla-counter";
import { StatusBadge } from "@/components/status-badge";
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
  MessageSquare,
  Search,
  Sparkles,
  Zap,
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

  return (
    <div className="bg-white">
      {/* ── HERO ─────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* 배경 오브 */}
        <div
          aria-hidden
          className="float-orb pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-brand-100/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-neutral-100/70 blur-3xl"
        />
        <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-14 sm:px-8 sm:pb-14 sm:pt-20">
          <Reveal>
            <Eyebrow>Booking OS · 광고주 콘솔</Eyebrow>
            <h1 className="display-kr mt-5 max-w-3xl text-4xl font-black sm:text-[3.4rem]">
              안녕하세요, 브라이트마케팅님
              <br />
              <span className="text-neutral-400">오늘도 완벽한 캐스팅을.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-neutral-500 sm:text-lg">
              진행 중인 섭외 {inProgress.length}건, 새 메시지 {unread}개.
              대행사를 거치지 않고 소속사와 직접, 매칭 수수료 0%로 연결됩니다.
            </p>
          </Reveal>

          {/* 프리미엄 검색 */}
          <Reveal delay={80} className="mt-9 max-w-2xl">
            <form action="/artists" className="group relative">
              <Search className="pointer-events-none absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-400" />
              <input
                name="q"
                placeholder="아티스트, 소속사, 키워드로 검색하세요"
                className="ambient premium-ease h-16 w-full rounded-full bg-white pl-14 pr-40 text-base outline-none placeholder:text-neutral-400 focus:ring-2 focus:ring-brand-200"
              />
              <button
                type="submit"
                className="premium-ease absolute right-2.5 top-1/2 flex h-11 -translate-y-1/2 items-center gap-2 rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white hover:bg-brand-500"
              >
                검색
              </button>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABELS) as ArtistCategory[]).map((c) => (
                <Link
                  key={c}
                  href={`/artists?category=${c}`}
                  className="premium-ease rounded-full bg-neutral-50 px-4 py-2 text-sm font-medium text-neutral-600 ring-1 ring-neutral-100 hover:bg-brand-50 hover:text-brand-700 hover:ring-brand-200"
                >
                  {CATEGORY_LABELS[c]}
                </Link>
              ))}
            </div>
          </Reveal>

          {/* SLA 라이브 */}
          <Reveal delay={140} className="mt-8 max-w-2xl">
            <SLACounter variant="inline" />
          </Reveal>
        </div>
      </section>

      {/* ── FEATURED ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <Reveal className="flex items-end justify-between">
          <div>
            <Eyebrow>Featured</Eyebrow>
            <h2 className="display-kr mt-3 text-2xl font-black sm:text-3xl">
              지금 섭외 가능한 아티스트
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              응답률과 가능 일정이 검증된 프로필만 큐레이션했어요
            </p>
          </div>
          <Link
            href="/artists"
            className="premium-ease hidden items-center gap-1.5 text-sm font-semibold text-neutral-900 hover:text-brand-600 sm:flex"
          >
            전체 보기
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {featured.map((artist, i) => (
            <Reveal key={artist.id} delay={i * 70}>
              <PremiumArtistCard artist={artist} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 콘솔 위젯 ─────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 pb-16 sm:px-8 sm:pb-24">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
          {/* 섭외 현황 */}
          <Reveal className="lg:col-span-1">
            <Link href="/requests" className="group block h-full">
              <div className="ambient ambient-hover flex h-full flex-col rounded-[1.75rem] bg-white p-7">
                <div className="flex items-center justify-between">
                  <Eyebrow>In Progress</Eyebrow>
                  <ArrowUpRight className="premium-ease h-4 w-4 text-neutral-300 group-hover:text-neutral-900" />
                </div>
                <p className="mt-5 text-5xl font-black tracking-tight">
                  {inProgress.length}
                  <span className="ml-2 text-base font-semibold text-neutral-400">
                    건 진행 중
                  </span>
                </p>
                <div className="mt-auto space-y-2.5 pt-6">
                  {inProgress.slice(0, 3).map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="truncate font-medium">
                        {r.artistName}
                      </span>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          </Reveal>

          {/* 새 메시지 */}
          <Reveal delay={80} className="lg:col-span-1">
            <Link
              href={
                latestRequest ? `/requests/${latestRequest.id}` : "/requests"
              }
              className="group block h-full"
            >
              <div className="ambient ambient-hover flex h-full flex-col rounded-[1.75rem] bg-white p-7">
                <div className="flex items-center justify-between">
                  <Eyebrow>Messages</Eyebrow>
                  {unread > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-500 px-2 text-xs font-bold text-white">
                      {unread}
                    </span>
                  )}
                </div>
                {latestMessage ? (
                  <>
                    <MessageSquare className="mt-5 h-5 w-5 text-brand-500" />
                    <p className="mt-3 line-clamp-3 text-[15px] font-medium leading-relaxed text-neutral-800">
                      &ldquo;{latestMessage.body}&rdquo;
                    </p>
                    <p className="mt-auto pt-5 text-xs text-neutral-400">
                      {latestMessage.senderName}
                    </p>
                  </>
                ) : (
                  <p className="mt-5 text-sm text-neutral-400">
                    아직 메시지가 없어요
                  </p>
                )}
              </div>
            </Link>
          </Reveal>

          {/* AI 캐스팅 (다크 프리미엄) */}
          <Reveal delay={160} className="lg:col-span-1">
            <Link href="/recommend" className="group block h-full">
              <div className="premium-ease relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-neutral-950 p-7 text-white group-hover:-translate-y-[3px]">
                <div
                  aria-hidden
                  className="float-orb pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/25 blur-2xl"
                />
                <div className="relative flex items-center justify-between">
                  <Eyebrow tone="light">AI Casting</Eyebrow>
                  <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold">
                    BETA
                  </span>
                </div>
                <Sparkles className="relative mt-5 h-6 w-6 text-brand-400" />
                <h3 className="display-kr relative mt-3 text-xl font-black">
                  예산만 넣으면
                  <br />딱 맞는 캐스팅을
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-neutral-400">
                  예산·카테고리·이미지 태그로 5초 만에 추천받으세요.
                </p>
                <span className="relative mt-auto flex items-center gap-1.5 pt-6 text-sm font-bold text-brand-400">
                  추천 시작하기
                  <ArrowUpRight className="premium-ease h-4 w-4 group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── 세트 라인업 ───────────────────────── */}
      <section className="border-t border-neutral-100 bg-neutral-50/60">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
          <Reveal>
            <Eyebrow>Curated Sets</Eyebrow>
            <h2 className="display-kr mt-3 text-2xl font-black sm:text-3xl">
              세트로 섭외하면 더 완성도 높게
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              소속사가 직접 큐레이션한 조합. 세트 할인까지.
            </p>
          </Reveal>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
            {BUNDLES.map((b, i) => (
              <Reveal key={b.id} delay={i * 70}>
                <LineupBundleCard bundle={b} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 인사이트 2열 ──────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          <Reveal>
            <div className="ambient h-full rounded-[1.75rem] bg-white p-7">
              <Eyebrow>
                <Zap className="h-3 w-3" /> Fast Response
              </Eyebrow>
              <h3 className="mt-3 text-lg font-black">빠른 응답 아티스트</h3>
              <div className="mt-5 divide-y divide-neutral-100">
                {fastResponders.map((a) => (
                  <Link
                    key={a.id}
                    href={`/artists/${a.id}`}
                    className="premium-ease flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-brand-600"
                  >
                    <span className="font-semibold">{a.name}</span>
                    <span className="text-sm text-neutral-400">
                      평균 {a.responseHours}시간
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div className="ambient h-full rounded-[1.75rem] bg-white p-7">
              <Eyebrow>
                <CalendarCheck className="h-3 w-3" /> This Week
              </Eyebrow>
              <h3 className="mt-3 text-lg font-black">이번 주 섭외 가능</h3>
              <div className="mt-5 divide-y divide-neutral-100">
                {availableThisWeek.map(({ artist, days }) => (
                  <Link
                    key={artist.id}
                    href={`/artists/${artist.id}`}
                    className="premium-ease flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:text-brand-600"
                  >
                    <span className="font-semibold">{artist.name}</span>
                    <span className="text-sm font-bold text-brand-600">
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
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8 sm:pb-28">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2.5rem] bg-neutral-950 px-8 py-16 text-center sm:px-16 sm:py-24">
            <div
              aria-hidden
              className="float-orb pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-brand-500/20 blur-3xl"
            />
            <div className="relative">
              <Eyebrow tone="light" className="justify-center">
                수수료 0%
              </Eyebrow>
              <h2 className="display-kr mx-auto mt-4 max-w-2xl text-3xl font-black text-white sm:text-4xl">
                첫 섭외 요청까지{" "}
                <span className="text-brand-500">5분</span>이면 충분합니다
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-neutral-400">
                대행사 거품 없이, 검증된 소속사와 직접. 요청은 언제나 무료예요.
              </p>
              <div className="mt-9 flex justify-center">
                <PremiumCTA href="/artists" variant="solid">
                  아티스트 둘러보기
                </PremiumCTA>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
