import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  ARTISTS,
  BOOKING_REQUESTS,
  SCHEDULES,
  THREAD_MESSAGES,
} from "@/lib/mock-data";
import {
  CATEGORY_LABELS,
  formatBudget,
  formatFollowers,
  type ArtistCategory,
} from "@/lib/types";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  Megaphone,
  MessageSquare,
  Search,
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
  const recommended = ARTISTS.slice(0, 4);
  const fastResponders = [...ARTISTS]
    .sort((a, b) => a.responseHours - b.responseHours)
    .slice(0, 3);
  // 이번 주(7/7~7/13) 가능일이 많은 순
  const availableThisWeek = ARTISTS.map((a) => ({
    artist: a,
    days: (SCHEDULES[a.id] ?? [])
      .slice(6, 13)
      .filter((d) => d.availability === "available").length,
  }))
    .sort((x, y) => y.days - x.days)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">
          안녕하세요, 브라이트마케팅님
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          진행 중인 섭외 {inProgress.length}건, 새 메시지 {unread}개가 있어요
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 검색 타일 */}
        <Card className="p-6 md:col-span-2">
          <h2 className="text-lg font-bold">어떤 아티스트를 찾으세요?</h2>
          <form action="/artists" className="relative mt-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              name="q"
              placeholder="아티스트, 소속사, 키워드 검색"
              className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-50 pl-10 pr-4 text-sm placeholder:text-neutral-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
          </form>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {(Object.keys(CATEGORY_LABELS) as ArtistCategory[]).map((c) => (
              <Link
                key={c}
                href={`/artists?category=${c}`}
                className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 transition-colors hover:border-brand-500 hover:bg-brand-50 hover:text-brand-700"
              >
                {CATEGORY_LABELS[c]}
              </Link>
            ))}
          </div>
        </Card>

        {/* 섭외 현황 타일 */}
        <Link href="/requests" className="group">
          <Card className="flex h-full flex-col p-6 transition-colors group-hover:border-neutral-900">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-neutral-500">섭외 현황</h2>
              <ArrowUpRight className="h-4 w-4 text-neutral-300 transition-colors group-hover:text-neutral-900" />
            </div>
            <p className="mt-3 text-4xl font-black">
              {inProgress.length}
              <span className="ml-1 text-base font-semibold text-neutral-400">
                건 진행 중
              </span>
            </p>
            <div className="mt-auto space-y-2 pt-4">
              {inProgress.slice(0, 2).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="truncate font-medium">{r.artistName}</span>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </Card>
        </Link>

        {/* 새 메시지 타일 */}
        <Link
          href={latestRequest ? `/requests/${latestRequest.id}` : "/requests"}
          className="group"
        >
          <Card className="flex h-full flex-col p-6 transition-colors group-hover:border-neutral-900">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
                <MessageSquare className="h-3.5 w-3.5" /> 새 메시지
              </h2>
              {unread > 0 && <Badge variant="solid">{unread}</Badge>}
            </div>
            {latestMessage ? (
              <>
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-neutral-700">
                  {latestMessage.body}
                </p>
                <p className="mt-auto pt-3 text-xs text-neutral-400">
                  {latestMessage.senderName}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-neutral-400">
                아직 메시지가 없어요
              </p>
            )}
          </Card>
        </Link>

        {/* 추천 아티스트 타일 */}
        <Card className="p-6 md:col-span-2 lg:row-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">추천 아티스트</h2>
            <Link
              href="/artists"
              className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              전체 보기 <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 divide-y divide-neutral-100">
            {recommended.map((a) => (
              <Link
                key={a.id}
                href={`/artists/${a.id}`}
                className="group flex items-center gap-4 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-brand-50 text-lg font-black text-neutral-300">
                  {a.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold group-hover:text-brand-600">
                      {a.name}
                    </span>
                    {a.verified && (
                      <BadgeCheck className="h-4 w-4 text-brand-500" />
                    )}
                  </div>
                  <p className="truncate text-xs text-neutral-500">
                    {CATEGORY_LABELS[a.category]} · 팔로워{" "}
                    {formatFollowers(a.followers)} · 응답률 {a.responseRate}%
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold text-neutral-700">
                  {formatBudget(a.budgetRange[0])}~
                </span>
              </Link>
            ))}
          </div>
        </Card>

        {/* 공고 올리기 타일 (역경매) */}
        <Card className="border-neutral-900 bg-neutral-950 p-6 text-white md:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Megaphone className="h-4.5 w-4.5 text-brand-500" /> 섭외 공고
                올리기
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-400">
                조건만 올리면 소속사가 직접 지원해요. 원하는 아티스트를 못
                찾았을 때 가장 빠른 방법입니다.
              </p>
            </div>
          </div>
          <button className="mt-5 h-10 rounded-lg bg-brand-500 px-4 text-sm font-semibold transition-colors hover:bg-brand-600">
            공고 작성하기
          </button>
        </Card>

        {/* 빠른 응답 타일 */}
        <Card className="p-6">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
            <Zap className="h-3.5 w-3.5 text-brand-500" /> 빠른 응답
          </h2>
          <div className="mt-3 space-y-3">
            {fastResponders.map((a) => (
              <Link
                key={a.id}
                href={`/artists/${a.id}`}
                className="flex items-center justify-between text-sm hover:text-brand-600"
              >
                <span className="font-medium">{a.name}</span>
                <span className="text-xs text-neutral-400">
                  평균 {a.responseHours}시간
                </span>
              </Link>
            ))}
          </div>
        </Card>

        {/* 이번 주 가능 타일 */}
        <Card className="p-6">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
            <CalendarCheck className="h-3.5 w-3.5 text-brand-500" /> 이번 주
            섭외 가능
          </h2>
          <div className="mt-3 space-y-3">
            {availableThisWeek.map(({ artist, days }) => (
              <Link
                key={artist.id}
                href={`/artists/${artist.id}`}
                className="flex items-center justify-between text-sm hover:text-brand-600"
              >
                <span className="font-medium">{artist.name}</span>
                <span className="text-xs font-semibold text-brand-600">
                  {days}일 가능
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
