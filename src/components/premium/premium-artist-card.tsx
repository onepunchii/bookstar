import Link from "next/link";
import { getRatingSummaryBySlug } from "@/lib/mock-data";
import { fetchYoutubeSubscribers } from "@/lib/youtube";
import {
  formatBudget,
  formatFollowers,
  type Artist,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { ArrowUpRight, BadgeCheck, Star } from "lucide-react";

// 광고주용 다크 럭셔리 카드 — 대형 비주얼, 유리 질감, 오렌지 글로우
export async function PremiumArtistCard({
  artist,
  className,
}: {
  artist: Artist;
  className?: string;
}) {
  const { t, locale } = await getT();
  const rating = getRatingSummaryBySlug(artist.slug);
  // 유튜브 채널 있으면 실 구독자, 없으면 저장 팔로워
  const ytSubs = artist.youtube
    ? await fetchYoutubeSubscribers(artist.youtube)
    : null;
  const followerValue = ytSubs ?? artist.followers;
  // 유튜브 연동 시 실 구독자, 아니면 등록된 대표 팔로워 수치
  const followerLabel = ytSubs ? t("premiumCard.youtube") : t("artists.detail.followers");
  return (
    <Link href={`/artists/${artist.slug}`} className={cn("group block", className)}>
      <div className="adv-card adv-card-hover overflow-hidden rounded-[1.75rem]">
        {/* 비주얼 */}
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-900">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-800 via-neutral-900 to-black" />
          <div
            aria-hidden
            className="premium-ease absolute -right-8 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-brand-500/10 blur-3xl group-hover:bg-brand-500/25"
          />
          {artist.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={artist.imageUrl}
                alt={artist.name}
                className="premium-ease absolute inset-0 h-full w-full object-cover group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </>
          ) : (
            <span className="premium-ease absolute inset-0 flex items-center justify-center text-7xl font-black text-white/10 group-hover:scale-105 group-hover:text-brand-500/30">
              {artist.name.slice(0, 1)}
            </span>
          )}
          {/* 상단 메타 */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <div className="flex flex-wrap gap-1.5">
              {artist.categories.slice(0, 1).map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur"
                >
                  {t(`category.${c}`)}
                </span>
              ))}
            </div>
            {rating.count > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                <Star className="h-2.5 w-2.5 fill-brand-400 text-brand-400" />
                {rating.avg.toFixed(1)}
              </span>
            )}
          </div>
          {/* 하단 그라디언트 + 이름 */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-5 pt-16">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xl font-black tracking-tight text-white">
                {artist.name}
              </h3>
              {artist.verified && (
                <BadgeCheck className="h-4 w-4 text-brand-400" />
              )}
            </div>
            <p className="mt-0.5 line-clamp-1 text-sm text-white/55">
              {artist.tagline}
            </p>
          </div>
          {/* 호버 화살표 */}
          <span className="premium-ease absolute right-4 top-14 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-brand-500 text-white opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        {/* 정보 바 */}
        <div className="flex items-center justify-between gap-2 px-4 py-3.5 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <p className="eyebrow text-white/35">{followerLabel}</p>
            <p className="mt-0.5 text-sm font-bold text-white/90">
              {formatFollowers(followerValue, locale)}
            </p>
          </div>
          <div className="h-8 w-px shrink-0 bg-white/10" />
          <div className="min-w-0 text-right">
            <p className="eyebrow text-white/35">{t("premiumCard.price")}</p>
            <p className="mt-0.5 whitespace-nowrap text-sm font-bold text-white/90">
              {formatBudget(artist.budgetRange[0], locale)}~
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
