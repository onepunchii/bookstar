import { Sparkline } from "@/components/sparkline";
import { Card } from "@/components/ui/card";
import { recentDelta } from "@/lib/metrics";
import { fetchNaverMomentum } from "@/lib/naver";
import { formatFollowers } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Link2, TrendingUp } from "lucide-react";

// 카테고리 → 네이버 기사 검색 결합 키워드(동명 단어 오매핑 완화)
const CATEGORY_KEYWORD: Record<string, string> = {
  idol: "아이돌",
  actor: "배우",
  model: "모델",
  mc: "MC",
  influencer: "인플루언서",
  athlete: "선수",
  speaker: "강연",
};

export async function MomentumCard({
  artistName,
  categories = [],
  youtubeSubscribers,
  instagram,
  followers = 0,
  dark = false,
}: {
  artistName?: string;
  categories?: string[];
  youtubeSubscribers?: number | null;
  instagram?: string | null;
  followers?: number;
  dark?: boolean;
}) {
  const hasYt = typeof youtubeSubscribers === "number" && youtubeSubscribers > 0;
  const hasInsta = !!instagram;
  const hasSns = hasYt || hasInsta;

  const Wrap = ({ children }: { children: React.ReactNode }) =>
    dark ? (
      <div className="adv-card rounded-[1.75rem] p-6">{children}</div>
    ) : (
      <Card className="p-6">{children}</Card>
    );

  const header = (
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
    </div>
  );

  // SNS 미연동 → 화제성 지표 없음(가짜 표시하지 않음)
  if (!hasSns) {
    return (
      <Wrap>
        {header}
        <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-dashed border-white/10 p-4 text-sm">
          <Link2 className={cn("h-4 w-4 shrink-0", dark ? "text-white/40" : "text-neutral-400")} />
          <p className={dark ? "text-white/55" : "text-neutral-500"}>
            유튜브·인스타그램을 연동하면 구독자·검색·기사 화제성 지표가 표시돼요.
          </p>
        </div>
      </Wrap>
    );
  }

  // 카테고리 결합 네이버 실데이터 (검색 트렌드·기사 수)
  const hint = categories.map((c) => CATEGORY_KEYWORD[c]).find(Boolean);
  const real = artistName ? await fetchNaverMomentum(artistName, hint) : null;

  const followerValue = hasYt ? youtubeSubscribers! : followers;
  const items: {
    label: string;
    value: string;
    delta: number;
    series: number[];
  }[] = [
    {
      label: hasYt ? "유튜브 구독자" : "인스타 팔로워",
      value: formatFollowers(followerValue),
      delta: 0,
      series: [],
    },
  ];
  if (real) {
    items.push({
      label: "검색 트렌드",
      value: `${real.searchSeries[real.searchSeries.length - 1]}`,
      delta: recentDelta(real.searchSeries, 7),
      series: real.searchSeries,
    });
    items.push({
      label: "네이버 기사",
      value: `${real.newsCount.toLocaleString()}건`,
      delta: 0,
      series: [],
    });
  }

  const dimColor = dark ? "rgba(255,255,255,0.35)" : "var(--color-neutral-400)";

  return (
    <Wrap>
      <div className="flex items-center justify-between">
        {header}
        <p className={cn("text-xs", dark ? "text-white/40" : "text-neutral-400")}>
          {real ? "네이버·SNS 실데이터" : "SNS 실데이터"}
        </p>
      </div>

      <div
        className={cn(
          "mt-5 grid grid-cols-1 gap-4",
          items.length >= 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"
        )}
      >
        {items.map((item) => {
          const isPositive = item.delta > 0;
          const color = isPositive ? "var(--color-brand-500)" : dimColor;
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
                {isPositive && (
                  <span className="flex items-center text-xs font-bold text-brand-500">
                    <ArrowUpRight className="h-3 w-3" />
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
