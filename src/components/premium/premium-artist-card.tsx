import Link from "next/link";
import { getRatingSummary } from "@/lib/mock-data";
import {
  CATEGORY_LABELS,
  formatBudget,
  formatFollowers,
  type Artist,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowUpRight, BadgeCheck, Star } from "lucide-react";

// 광고주용 프리미엄 카드 — 큰 이미지 영역, 절제된 정보, 앰비언트 섀도우
export function PremiumArtistCard({
  artist,
  className,
}: {
  artist: Artist;
  className?: string;
}) {
  const rating = getRatingSummary(artist.id);
  return (
    <Link href={`/artists/${artist.id}`} className={cn("group block", className)}>
      <div className="ambient ambient-hover overflow-hidden rounded-[1.75rem] bg-white">
        {/* 비주얼 */}
        <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
          <div className="absolute inset-0 bg-gradient-to-br from-neutral-100 via-white to-brand-50" />
          <span className="premium-ease absolute inset-0 flex items-center justify-center text-7xl font-black text-neutral-200 group-hover:scale-105 group-hover:text-brand-200">
            {artist.name.slice(0, 1)}
          </span>
          {/* 상단 메타 */}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
            <div className="flex flex-wrap gap-1.5">
              {artist.categories.slice(0, 1).map((c) => (
                <span
                  key={c}
                  className="rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-bold text-neutral-900 backdrop-blur"
                >
                  {CATEGORY_LABELS[c]}
                </span>
              ))}
            </div>
            {rating.count > 0 && (
              <span className="flex items-center gap-1 rounded-full bg-neutral-950/85 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
                <Star className="h-2.5 w-2.5 fill-brand-400 text-brand-400" />
                {rating.avg.toFixed(1)}
              </span>
            )}
          </div>
          {/* 하단 그라디언트 + 이름 */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/70 to-transparent p-5 pt-16">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xl font-black tracking-tight text-white">
                {artist.name}
              </h3>
              {artist.verified && (
                <BadgeCheck className="h-4 w-4 text-brand-400" />
              )}
            </div>
            <p className="mt-0.5 line-clamp-1 text-sm text-white/70">
              {artist.tagline}
            </p>
          </div>
          {/* 호버 화살표 */}
          <span className="premium-ease absolute right-4 top-14 flex h-9 w-9 translate-y-1 items-center justify-center rounded-full bg-white text-neutral-900 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        {/* 정보 바 */}
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <p className="eyebrow text-neutral-400">Followers</p>
            <p className="mt-0.5 text-sm font-bold">
              {formatFollowers(artist.followers)}
            </p>
          </div>
          <div className="h-8 w-px bg-neutral-100" />
          <div className="text-right">
            <p className="eyebrow text-neutral-400">예상 섭외가</p>
            <p className="mt-0.5 text-sm font-bold">
              {formatBudget(artist.budgetRange[0])}~
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
