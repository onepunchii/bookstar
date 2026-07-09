import Link from "next/link";
import { todayKST } from "@/lib/date";
import { FeedbackBox } from "@/components/feedback-box";
import { Sparkline } from "@/components/sparkline";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAgencyArtists, getPublicScheduleMap } from "@/lib/data/artists";
import { getBookingRequests } from "@/lib/data/booking-requests";
import { countOpenCampaigns } from "@/lib/data/campaigns";
import { getSessionAgency } from "@/lib/data/session";
import { generateMetrics, recentDelta } from "@/lib/metrics";
import { mockIdForSlug } from "@/lib/mock-data";
import { getAgencyBundles } from "@/lib/data/bundles";
import { BundlesPanel } from "./bundles-panel";
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
  TrendingUp,
} from "lucide-react";

const TODAY = todayKST();

export default async function AgencyDashboardPage() {
  const agency = await getSessionAgency();
  const [ARTISTS, BOOKING_REQUESTS, scheduleMap, openCampaigns, bundles] =
    await Promise.all([
      getAgencyArtists(agency?.id),
      getBookingRequests(agency ? { agencyId: agency.id } : undefined),
      getPublicScheduleMap(),
      countOpenCampaigns(),
      agency ? getAgencyBundles(agency.id) : Promise.resolve([]),
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
    <>
      {/* 오픈 캠페인 발견 훅 — 모집 중일 때만 */}
      {openCampaigns > 0 && (
        <Link
          href="/agency/campaigns"
          className="mb-4 flex items-center gap-3 rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-4 transition-colors hover:border-brand-500"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Flame className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-neutral-900">
              오픈 캠페인 {openCampaigns}건 모집 중
            </p>
            <p className="text-xs text-neutral-500">
              광고주가 올린 섭외 건에 우리 아티스트로 직접 지원하세요
            </p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-brand-500" />
        </Link>
      )}
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
          <CalendarDays className="h-3.5 w-3.5 text-brand-500" /> 오늘 ({Number(TODAY.slice(5, 7))}/{Number(TODAY.slice(8))})
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

      {/* 번들 상품 — 실제 생성/삭제 (company 전용) */}
      <BundlesPanel
        bundles={bundles}
        artists={ARTISTS}
        agencyType={agency?.agencyType ?? "solo"}
      />

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

      {/* 건의함 — 제휴·버그·개선 (최하단) */}
      <div className="mt-6">
        <FeedbackBox role="agency" />
      </div>
    </>
  );
}
