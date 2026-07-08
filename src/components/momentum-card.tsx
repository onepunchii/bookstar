import { Sparkline } from "@/components/sparkline";
import { Card } from "@/components/ui/card";
import { generateMetrics, recentDelta, recentSum } from "@/lib/metrics";
import { fetchNaverMomentum } from "@/lib/naver";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";

export async function MomentumCard({
  artistId,
  artistName,
  youtubeSubscribers,
  dark = false,
}: {
  artistId: string;
  artistName?: string;
  youtubeSubscribers?: number | null;
  dark?: boolean;
}) {
  const m = generateMetrics(artistId);
  // 네이버 실데이터 (검색 트렌드·기사 수). 실패/저노출이면 mock.
  const real = artistName ? await fetchNaverMomentum(artistName) : null;

  const searchSeries = real ? real.searchSeries : m.search;
  const searchLast = searchSeries[searchSeries.length - 1];
  const searchDelta = recentDelta(searchSeries, 7);
  const newsSum = real ? real.newsCount : recentSum(m.news, 30);
  // 실측 기사 수는 총건수만 제공(일별 추이 없음) → 곡선 미표시
  const newsSeries = real ? [] : m.news;
  // 팔로워: 유튜브 실 구독자 있으면 그 값(만 단위), 없으면 mock
  const hasYt = typeof youtubeSubscribers === "number";
  const followersLast = hasYt
    ? Math.round(youtubeSubscribers! / 10000)
    : m.followers[m.followers.length - 1];
  const followersDelta = hasYt ? 0 : recentDelta(m.followers, 15);

  const items = [
    {
      label: real ? "네이버 기사" : "최근 30일 기사",
      value: real ? `${newsSum.toLocaleString()}건` : `${newsSum}건`,
      delta: real ? 0 : recentDelta(m.news, 7),
      series: newsSeries,
    },
    { label: "검색 트렌드", value: `${searchLast}`, delta: searchDelta, series: searchSeries },
    {
      label: hasYt ? "유튜브 구독자 (만)" : "팔로워 (만)",
      value: `${followersLast.toLocaleString()}`,
      delta: followersDelta,
      // 실측일 땐 가짜 추이 곡선을 그리지 않음 (현재값만)
      series: hasYt ? [] : m.followers,
    },
  ];

  const dimColor = dark ? "rgba(255,255,255,0.35)" : "var(--color-neutral-400)";

  const Wrap = ({ children }: { children: React.ReactNode }) =>
    dark ? (
      <div className="adv-card rounded-[1.75rem] p-6">{children}</div>
    ) : (
      <Card className="p-6">{children}</Card>
    );

  return (
    <Wrap>
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={cn(
              "flex items-center gap-1.5 text-lg font-bold",
              dark && "text-white"
            )}
          >
            <TrendingUp className="h-4 w-4 text-brand-500" />
            화제성 · 팬덤
          </h2>
          <p className={cn("mt-0.5 text-xs", dark ? "text-white/40" : "text-neutral-400")}>
            {real && hasYt
              ? "지난 30일 · 네이버 검색·기사 + YouTube 구독자 실데이터"
              : real
                ? "지난 30일 · 네이버 실데이터 (구독자는 YouTube 연동 시 반영)"
                : hasYt
                  ? "검색·기사는 데모, 구독자는 YouTube 실데이터"
                  : "지난 30일 · 데모 데이터 (실데이터는 네이버/YouTube 연동 시 반영)"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((item) => {
          const isPositive = item.delta > 0;
          const isNeutral = item.delta === 0;
          const color = isNeutral
            ? dimColor
            : isPositive
              ? "var(--color-brand-500)"
              : dimColor;
          return (
            <div
              key={item.label}
              className={cn(
                "rounded-xl p-4",
                dark
                  ? "bg-white/[0.04] ring-1 ring-white/8"
                  : "border border-neutral-100 bg-neutral-50/40"
              )}
            >
              <p className={cn("text-xs", dark ? "text-white/50" : "text-neutral-500")}>
                {item.label}
              </p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className={cn("text-2xl font-black", dark && "text-white")}>
                  {item.value}
                </p>
                {!isNeutral && (
                  <span
                    className={cn(
                      "flex items-center text-xs font-bold",
                      isPositive
                        ? "text-brand-500"
                        : dark
                          ? "text-white/40"
                          : "text-neutral-400"
                    )}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(item.delta)}%
                  </span>
                )}
              </div>
              <div className="mt-2">
                {item.series.length > 0 && (
                  <Sparkline
                    values={item.series}
                    width={220}
                    height={36}
                    color={color}
                    className="w-full"
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Wrap>
  );
}
