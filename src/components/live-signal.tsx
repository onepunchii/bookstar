import Link from "next/link";
import { Eyebrow } from "@/components/premium/eyebrow";
import { Reveal } from "@/components/premium/reveal";
import { Sparkline } from "@/components/sparkline";
import { recentDelta } from "@/lib/metrics";
import { fetchNaverMomentum } from "@/lib/naver";
import { fetchYoutubeSubscribers } from "@/lib/youtube";
import { formatFollowers, type Artist } from "@/lib/types";
import { getT } from "@/lib/i18n/server";
import { ArrowDownRight, ArrowUpRight, Newspaper, Play } from "lucide-react";

interface Signal {
  artist: Artist;
  series: number[]; // 네이버 검색 트렌드 (최근 30일 일별, 실측)
  news: number; // 네이버 뉴스 총 기사 수 (실측)
  subs: number | null; // 유튜브 구독자 (실측)
  delta: number; // 최근 7일 검색량 변화율
}

// 라이브 시그널 — 네이버 검색·뉴스 + 유튜브 실측 데이터로 "지금 뜨는" 아티스트 랭킹.
// 실데이터가 잡히는 아티스트만 노출(가짜 숫자 없음). 하나도 없으면 섹션 자체 미노출.
export async function LiveSignal({ artists }: { artists: Artist[] }) {
  const { t } = await getT();
  const enriched = (
    await Promise.all(
      artists.slice(0, 10).map(async (artist) => {
        const m = await fetchNaverMomentum(artist.name);
        if (!m) return null;
        const subs = artist.youtube
          ? await fetchYoutubeSubscribers(artist.youtube)
          : null;
        return {
          artist,
          series: m.searchSeries,
          news: m.newsCount,
          subs,
          delta: recentDelta(m.searchSeries, 7),
        } satisfies Signal;
      })
    )
  ).filter((s): s is Signal => s !== null);

  if (enriched.length === 0) return null;
  const top = enriched.sort((a, b) => b.delta - a.delta).slice(0, 3);

  return (
    <section className="mt-14 sm:mt-20">
      <Reveal>
        <div className="flex items-center gap-2">
          <Eyebrow>Live Signal</Eyebrow>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-500 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
        </div>
        <h2 className="display-kr mt-3 text-xl font-black text-white sm:text-3xl">
          {t("home.live.heading")}
        </h2>
        <p className="mt-1.5 text-sm text-white/40">
          {t("home.live.subtitle")}
        </p>
      </Reveal>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:gap-6 lg:grid-cols-3">
        {top.map((s, i) => {
          const up = s.delta >= 0;
          return (
            <Reveal key={s.artist.id} delay={i * 60}>
              <Link
                href={`/artists/${s.artist.slug}`}
                className="adv-card adv-card-hover block rounded-[1.75rem] p-5"
              >
                <div className="flex items-center gap-3.5">
                  <span className="text-lg font-black tabular-nums text-white/25">
                    {i + 1}
                  </span>
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                    {s.artist.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.artist.imageUrl}
                        alt={s.artist.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg font-black text-white/30">
                        {s.artist.name.slice(0, 1)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">
                      {s.artist.name}
                    </p>
                    <p
                      className={
                        up
                          ? "flex items-center gap-0.5 text-xs font-bold text-brand-400"
                          : "flex items-center gap-0.5 text-xs font-bold text-white/40"
                      }
                    >
                      {up ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {t("home.live.searchVolume")} {up ? "+" : ""}
                      {s.delta}% <span className="font-normal text-white/35">{t("home.live.perWeek")}</span>
                    </p>
                  </div>
                </div>

                {/* 실측 검색 트렌드 곡선 (최근 14일) */}
                <div className="mt-4">
                  <Sparkline
                    values={s.series.slice(-14)}
                    width={240}
                    height={40}
                    className="h-10 w-full"
                    color={up ? "var(--color-brand-500)" : "rgba(255,255,255,0.35)"}
                  />
                </div>

                <div className="mt-3 flex items-center gap-4 border-t border-white/8 pt-3 text-xs text-white/50">
                  <span className="flex items-center gap-1.5">
                    <Newspaper className="h-3 w-3 text-white/30" />
                    {t("home.live.newsCount", { count: s.news.toLocaleString() })}
                  </span>
                  {s.subs != null && (
                    <span className="flex items-center gap-1.5">
                      <Play className="h-3 w-3 text-white/30" />
                      {t("home.live.subscribers", { count: formatFollowers(s.subs) })}
                    </span>
                  )}
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
