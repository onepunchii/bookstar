import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RatingStars } from "@/components/rating-stars";
import { getRatingSummary } from "@/lib/mock-data";
import {
  formatBudget,
  formatFollowers,
  type Artist,
} from "@/lib/types";
import { getT } from "@/lib/i18n/server";
import { BadgeCheck, Zap } from "lucide-react";

export async function ArtistCard({ artist }: { artist: Artist }) {
  const rating = getRatingSummary(artist.id);
  const { t } = await getT();
  return (
    <Link href={`/artists/${artist.id}`} className="group">
      <Card className="h-full overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:border-neutral-900 group-hover:shadow-lg group-hover:shadow-neutral-900/5">
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-neutral-100 to-brand-50">
          <span className="text-5xl font-black text-neutral-300 transition-colors group-hover:text-brand-300">
            {artist.name.slice(0, 1)}
          </span>
          {artist.responseHours <= 6 && (
            <Badge variant="solid" className="absolute left-3 top-3">
              <Zap className="h-3 w-3" /> {t("artistCard.fastResponse")}
            </Badge>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold">{artist.name}</h3>
            {artist.verified && (
              <BadgeCheck className="h-4 w-4 text-brand-500" />
            )}
            <span className="ml-auto text-xs text-neutral-400">
              {artist.agencyName}
            </span>
          </div>
          <p className="mt-1 line-clamp-1 text-sm text-neutral-500">
            {artist.tagline}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {artist.categories.map((c) => (
              <Badge key={c} variant="brand">
                {t(`category.${c}`)}
              </Badge>
            ))}
            {artist.tags.slice(0, 2).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm">
            <div className="text-neutral-500">
              {t("artists.detail.followers")}{" "}
              <span className="font-semibold text-neutral-900">
                {formatFollowers(artist.followers)}
              </span>
            </div>
            {rating.count > 0 ? (
              <div className="flex items-center gap-1">
                <RatingStars value={rating.avg} size="sm" />
                <span className="text-xs font-semibold text-neutral-700">
                  {rating.avg.toFixed(1)}
                </span>
              </div>
            ) : (
              <div className="text-neutral-500">
                {t("artists.detail.responseRate")}{" "}
                <span className="font-semibold text-brand-600">
                  {artist.responseRate}%
                </span>
              </div>
            )}
          </div>
          <div className="mt-2 text-sm text-neutral-500">
            {t("artistCard.budget")}{" "}
            <span className="font-semibold text-neutral-900">
              {formatBudget(artist.budgetRange[0])} ~{" "}
              {formatBudget(artist.budgetRange[1])}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
