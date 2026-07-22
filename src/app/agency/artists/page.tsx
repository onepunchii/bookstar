import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAgencyArtists } from "@/lib/data/artists";
import { getSessionAgency } from "@/lib/data/session";
import { artistLimit } from "@/lib/plan";
import { profileCompleteness } from "@/lib/profile";
import { CATEGORY_LABELS, formatBudget } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { Camera, Pencil } from "lucide-react";
import { NewArtistButton } from "./new-artist-button";
import { StartAgencyButton } from "../start-agency-button";

export default async function AgencyArtistsPage() {
  const { t, locale } = await getT();
  const agency = await getSessionAgency();
  const visible = await getAgencyArtists(agency?.id);
  const demo = !agency;
  return (
    <div>
      {demo && (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          👀 <span className="font-bold">{t("agency.artists.demoBadge")}</span> —{" "}
          {t("agency.artists.demoDesc")}
          <div>
            <StartAgencyButton />
          </div>
        </div>
      )}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-neutral-500">
          {t("agency.artists.teamCount", { n: visible.length })}
          {agency &&
            Number.isFinite(artistLimit(agency.agencyType)) &&
            ` / ${t("agency.artists.teamLimit", { n: artistLimit(agency.agencyType) })}`}{" "}
          {t("agency.artists.manageHint")}
        </p>
        {agency &&
          agency.agencyType === "solo" &&
          visible.length >= artistLimit(agency.agencyType) && (
            <Link
              href="/agency/account"
              className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600"
            >
              {t("agency.artists.upgradeCta")}
            </Link>
          )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 새 아티스트 등록 */}
        <NewArtistButton />

        {visible.map((artist) => {
          const { score } = profileCompleteness(artist);
          return (
            <Card key={artist.id} className="overflow-hidden">
              <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-neutral-100 to-brand-50">
                <span className="text-4xl font-black text-neutral-300">
                  {artist.name.slice(0, 1)}
                </span>
                {!artist.imageUrl && (
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-500">
                    <Camera className="h-3 w-3" /> {t("agency.artists.noPhoto")}
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{artist.name}</span>
                    <Badge variant="brand">
                      {CATEGORY_LABELS[artist.category]}
                    </Badge>
                  </div>
                  <Badge
                    variant={artist.verified ? "dark" : "outline"}
                  >
                    {artist.verified
                      ? t("agency.artists.statusPublic")
                      : t("agency.artists.statusReview")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {t("agency.artists.budgetRange", {
                    min: formatBudget(artist.budgetRange[0], locale),
                    max: formatBudget(artist.budgetRange[1], locale),
                  })}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">
                      {t("agency.artists.completeness")}
                    </span>
                    <span
                      className={cn(
                        "font-bold",
                        score >= 80 ? "text-neutral-700" : "text-brand-600"
                      )}
                    >
                      {score}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-neutral-100">
                    <div
                      className="h-1.5 rounded-full bg-brand-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
                <Link
                  href={`/agency/artists/${artist.slug}`}
                  className="mt-4 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 text-sm font-semibold transition-colors hover:border-neutral-900"
                >
                  <Pencil className="h-3.5 w-3.5" />{" "}
                  {t("agency.artists.manageProfile")}
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
