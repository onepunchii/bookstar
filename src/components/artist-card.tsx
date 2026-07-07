import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  CATEGORY_LABELS,
  formatBudget,
  formatFollowers,
  type Artist,
} from "@/lib/types";
import { BadgeCheck, Zap } from "lucide-react";

export function ArtistCard({ artist }: { artist: Artist }) {
  return (
    <Link href={`/artists/${artist.id}`} className="group">
      <Card className="h-full overflow-hidden transition-all group-hover:-translate-y-0.5 group-hover:border-neutral-900 group-hover:shadow-lg group-hover:shadow-neutral-900/5">
        <div className="relative flex h-40 items-center justify-center bg-gradient-to-br from-neutral-100 to-brand-50">
          <span className="text-5xl font-black text-neutral-300 transition-colors group-hover:text-brand-300">
            {artist.name.slice(0, 1)}
          </span>
          {artist.responseHours <= 6 && (
            <Badge variant="solid" className="absolute left-3 top-3">
              <Zap className="h-3 w-3" /> 빠른 응답
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
                {CATEGORY_LABELS[c]}
              </Badge>
            ))}
            {artist.tags.slice(0, 2).map((t) => (
              <Badge key={t}>{t}</Badge>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-neutral-100 pt-3 text-sm">
            <div className="text-neutral-500">
              팔로워{" "}
              <span className="font-semibold text-neutral-900">
                {formatFollowers(artist.followers)}
              </span>
            </div>
            <div className="text-neutral-500">
              응답률{" "}
              <span className="font-semibold text-brand-600">
                {artist.responseRate}%
              </span>
            </div>
          </div>
          <div className="mt-2 text-sm text-neutral-500">
            예산대{" "}
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
