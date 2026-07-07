import { Sparkline } from "@/components/sparkline";
import { Card } from "@/components/ui/card";
import { generateMetrics, recentDelta, recentSum } from "@/lib/metrics";
import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, TrendingUp } from "lucide-react";

const NEUTRAL_COLOR = "var(--color-neutral-400)";

export function MomentumCard({ artistId }: { artistId: string }) {
  const m = generateMetrics(artistId);
  const newsSum = recentSum(m.news, 30);
  const newsDelta = recentDelta(m.news, 7);
  const searchLast = m.search[m.search.length - 1];
  const searchDelta = recentDelta(m.search, 7);
  const followersLast = m.followers[m.followers.length - 1];
  const followersDelta = recentDelta(m.followers, 15);

  const items = [
    {
      label: "최근 30일 기사",
      value: `${newsSum}건`,
      delta: newsDelta,
      series: m.news,
    },
    {
      label: "검색 트렌드",
      value: `${searchLast}`,
      delta: searchDelta,
      series: m.search,
    },
    {
      label: "팔로워 (만)",
      value: `${followersLast.toLocaleString()}`,
      delta: followersDelta,
      series: m.followers,
    },
  ];

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-1.5 text-lg font-bold">
            <TrendingUp className="h-4 w-4 text-brand-500" />
            화제성 · 팬덤
          </h2>
          <p className="mt-0.5 text-xs text-neutral-400">
            지난 30일 · 데모 데이터 (실데이터는 네이버/YouTube 연동 시 자동
            반영)
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {items.map((item) => {
          const isPositive = item.delta > 0;
          const isNeutral = item.delta === 0;
          const color = isNeutral
            ? NEUTRAL_COLOR
            : isPositive
              ? "var(--color-brand-500)"
              : "var(--color-neutral-400)";
          return (
            <div
              key={item.label}
              className="rounded-xl border border-neutral-100 bg-neutral-50/40 p-4"
            >
              <p className="text-xs text-neutral-500">{item.label}</p>
              <div className="mt-1 flex items-baseline gap-2">
                <p className="text-2xl font-black">{item.value}</p>
                {!isNeutral && (
                  <span
                    className={cn(
                      "flex items-center text-xs font-bold",
                      isPositive ? "text-brand-600" : "text-neutral-400"
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
                <Sparkline
                  values={item.series}
                  width={220}
                  height={36}
                  color={color}
                  className="w-full"
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
