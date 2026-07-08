import Link from "next/link";
import { Sparkline } from "@/components/sparkline";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAgencyArtists, getPublicScheduleMap } from "@/lib/data/artists";
import { getBookingRequests } from "@/lib/data/booking-requests";
import { getSessionAgency } from "@/lib/data/session";
import { generateMetrics, recentDelta } from "@/lib/metrics";
import { ARTISTS as MOCK_ARTISTS, BUNDLES, mockIdForSlug } from "@/lib/mock-data";
import { profileCompleteness } from "@/lib/profile";
import { AVAILABILITY_LABELS, formatBudget } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleAlert,
  Clock,
  Flame,
  Inbox,
  Package,
  Plus,
  TrendingUp,
} from "lucide-react";

const TODAY = "2026-07-07";

export default async function AgencyDashboardPage() {
  const agency = await getSessionAgency();
  const [ARTISTS, BOOKING_REQUESTS, scheduleMap] = await Promise.all([
    getAgencyArtists(agency?.id),
    getBookingRequests(),
    getPublicScheduleMap(),
  ]);
  const pending = BOOKING_REQUESTS.filter((r) => r.status === "pending");
  const negotiating = BOOKING_REQUESTS.filter(
    (r) => r.status === "negotiating"
  );
  const accepted = BOOKING_REQUESTS.filter((r) => r.status === "accepted");
  const confirmedRevenue = accepted.reduce((sum, r) => sum + r.budget, 0);

  const todaySchedule = ARTISTS.map((a) => ({
    artist: a,
    day: (scheduleMap[a.id] ?? []).find((d) => d.date === TODAY),
  })).filter((x) => x.day);

  const incomplete = ARTISTS.map((a) => ({
    artist: a,
    ...profileCompleteness(a),
  }))
    .filter((x) => x.score < 100)
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const trending = ARTISTS.map((a) => {
    const m = generateMetrics(mockIdForSlug(a.slug) ?? a.id);
    return { artist: a, delta: recentDelta(m.news, 7), series: m.news };
  })
    .sort((x, y) => y.delta - x.delta)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* KPI */}
      {[
        {
          icon: Inbox,
          label: "새 요청",
          value: `${pending.length}건`,
          sub: "응답 대기 중",
          highlight: true,
          href: "/agency/inbox",
        },
        {
          icon: TrendingUp,
          label: "협의 중",
          value: `${negotiating.length}건`,
          sub: "견적 진행 중",
          href: "/agency/inbox",
        },
        {
          icon: Clock,
          label: "평균 응답",
          value: "4시간",
          sub: "응답률 98% · 빠른 응답 배지 유지 중",
        },
        {
          icon: CalendarDays,
          label: "이번 달 확정",
          value: formatBudget(confirmedRevenue),
          sub: `수락 ${accepted.length}건 기준`,
        },
      ].map((kpi) => {
        const inner = (
          <Card
            key={kpi.label}
            className={cn(
              "flex h-full flex-col p-5",
              kpi.href && "transition-colors hover:border-neutral-900",
              kpi.highlight && "border-brand-200 bg-brand-50/40"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
                <kpi.icon
                  className={cn(
                    "h-3.5 w-3.5",
                    kpi.highlight ? "text-brand-500" : "text-neutral-400"
                  )}
                />
                {kpi.label}
              </span>
              {kpi.href && (
                <ArrowUpRight className="h-4 w-4 text-neutral-300" />
              )}
            </div>
            <p
              className={cn(
                "mt-2 text-3xl font-black",
                kpi.highlight && "text-brand-600"
              )}
            >
              {kpi.value}
            </p>
            <p className="mt-1 text-xs text-neutral-400">{kpi.sub}</p>
          </Card>
        );
        return kpi.href ? (
          <Link key={kpi.label} href={kpi.href}>
            {inner}
          </Link>
        ) : (
          inner
        );
      })}

      {/* 응답 대기 요청 */}
      <Card className="p-6 md:col-span-2 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">응답을 기다리는 요청</h2>
          <Link
            href="/agency/inbox"
            className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            인박스 <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 space-y-3">
          {[...pending, ...negotiating].slice(0, 3).map((req) => (
            <div
              key={req.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold">
                    {req.companyName}
                  </span>
                  <Badge>{req.eventType}</Badge>
                </div>
                <p className="mt-0.5 truncate text-xs text-neutral-500">
                  {req.artistName} · {req.date} · 예산{" "}
                  {formatBudget(req.budget)}
                </p>
              </div>
              <StatusBadge status={req.status} />
            </div>
          ))}
        </div>
      </Card>

      {/* 오늘 일정 */}
      <Card className="p-6">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
          <CalendarDays className="h-3.5 w-3.5 text-brand-500" /> 오늘 (7/7)
        </h2>
        <div className="mt-3 space-y-2.5">
          {todaySchedule.slice(0, 5).map(({ artist, day }) => (
            <div
              key={artist.id}
              className="flex items-center justify-between text-sm"
            >
              <span className="font-medium">{artist.name}</span>
              <span
                className={cn(
                  "text-xs font-semibold",
                  day!.availability === "available"
                    ? "text-brand-600"
                    : day!.availability === "busy"
                      ? "text-neutral-300"
                      : "text-neutral-500"
                )}
              >
                {AVAILABILITY_LABELS[day!.availability]}
              </span>
            </div>
          ))}
        </div>
        <Link
          href="/agency/schedule"
          className="mt-4 block text-xs font-semibold text-brand-600 hover:text-brand-700"
        >
          일정 관리로 이동 →
        </Link>
      </Card>

      {/* 번들 상품 */}
      <Card className="p-6 md:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
            <Package className="h-3.5 w-3.5 text-brand-500" /> 번들 상품{" "}
            {BUNDLES.length}개
          </h2>
          <button className="flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-semibold text-brand-600 hover:text-brand-700">
            <Plus className="h-3 w-3" /> 새 번들 만들기
          </button>
        </div>
        <p className="mt-1 text-xs text-neutral-400">
          아티스트 조합을 세트로 팔면 단건보다 전환율 2배
        </p>
        <div className="mt-3 space-y-2">
          {BUNDLES.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50/60 px-4 py-3"
            >
              <div className="flex -space-x-1.5">
                {b.artistIds.slice(0, 3).map((id) => (
                  <span
                    key={id}
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-200 text-[10px] font-black text-neutral-500 ring-2 ring-white"
                  >
                    {(MOCK_ARTISTS.find((a) => a.id === id)?.name || "?").slice(0, 1)}
                  </span>
                ))}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{b.title}</p>
                <p className="text-xs text-neutral-400">{b.eventTypes.join(" · ")}</p>
              </div>
              {b.discountPct && (
                <Badge variant="solid">-{b.discountPct}%</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* 화제성 급증 */}
      <Card className="p-6">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
          <Flame className="h-3.5 w-3.5 text-brand-500" /> 화제성 급증
        </h2>
        <p className="mt-1 text-xs text-neutral-400">
          최근 7일 기사 증감률 Top 3
        </p>
        <div className="mt-3 space-y-3">
          {trending.map(({ artist, delta, series }) => (
            <Link
              key={artist.id}
              href={`/artists/${artist.slug}`}
              className="flex items-center gap-3 text-sm hover:text-brand-600"
            >
              <span className="min-w-0 flex-1 truncate font-medium">
                {artist.name}
              </span>
              <Sparkline
                values={series}
                width={60}
                height={20}
                color={
                  delta >= 0
                    ? "var(--color-brand-500)"
                    : "var(--color-neutral-400)"
                }
              />
              <span
                className={cn(
                  "shrink-0 text-xs font-bold",
                  delta >= 0 ? "text-brand-600" : "text-neutral-400"
                )}
              >
                {delta > 0 && "+"}
                {delta}%
              </span>
            </Link>
          ))}
        </div>
      </Card>

      {/* 프로필 완성도 */}
      <Card className="p-6">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
          <CircleAlert className="h-3.5 w-3.5 text-brand-500" /> 프로필
          완성도
        </h2>
        <p className="mt-1 text-xs text-neutral-400">
          완성도가 높을수록 검색 노출이 올라가요
        </p>
        <div className="mt-3 space-y-3">
          {incomplete.map(({ artist, score }) => (
            <Link
              key={artist.id}
              href={`/agency/artists/${artist.slug}`}
              className="block"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium hover:text-brand-600">
                  {artist.name}
                </span>
                <span className="text-xs font-semibold text-neutral-500">
                  {score}%
                </span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-neutral-100">
                <div
                  className="h-1.5 rounded-full bg-brand-500"
                  style={{ width: `${score}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
