import { Card } from "@/components/ui/card";
import { getAgencyFeed } from "@/lib/data/campaigns";
import { getAgencyArtists } from "@/lib/data/artists";
import { getSessionAgency } from "@/lib/data/session";
import {
  dday,
  formatBudgetRange,
} from "@/lib/campaign-options";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { CalendarClock, MapPin, Sparkles } from "lucide-react";
import { StartAgencyButton } from "../start-agency-button";
import { ApplyPanel } from "./apply-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "오픈 캠페인" };

export default async function AgencyCampaignsPage() {
  const { t } = await getT();
  const agency = await getSessionAgency();
  const [feed, artists] = await Promise.all([
    getAgencyFeed(agency?.id ?? null),
    getAgencyArtists(agency?.id),
  ]);
  const demo = !agency;
  const artistPicker = artists.map((a) => ({ id: a.id, name: a.name }));

  return (
    <div>
      {demo && (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          👀 <span className="font-bold">{t("agency.campaigns.testerBadge")}</span>{" "}
          {t("agency.campaigns.testerHint")}
          <div>
            <StartAgencyButton />
          </div>
        </div>
      )}

      <div className="mb-5">
        <h1 className="text-xl font-black tracking-tight text-neutral-900">
          {t("agency.campaigns.title")}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {t("agency.campaigns.subtitle", { n: feed.length })}
        </p>
      </div>

      <div className="space-y-3">
        {feed.map((c) => {
          const d = dday(c.deadline);
          return (
            <Card key={c.id} className="p-5">
              {c.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.imageUrl}
                  alt=""
                  className="mb-3 h-36 w-full rounded-xl object-cover"
                />
              )}
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600">
                  {c.eventType}
                </span>
                {c.matched && (
                  <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600">
                    <Sparkles className="h-3 w-3" /> {t("agency.campaigns.matched")}
                  </span>
                )}
                <span
                  className={cn(
                    "ml-auto text-[11px] font-bold tabular-nums",
                    d.urgent ? "text-brand-600" : "text-neutral-400"
                  )}
                >
                  {d.label}
                </span>
              </div>

              <p className="mt-2.5 font-bold text-neutral-900">{c.title}</p>

              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                <span className="font-semibold text-neutral-700">
                  {formatBudgetRange(c.budgetMin, c.budgetMax)}
                </span>
                {c.eventDate && (
                  <span className="flex items-center gap-1">
                    <CalendarClock className="h-3.5 w-3.5" /> {c.eventDate}
                  </span>
                )}
                {c.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {c.location}
                  </span>
                )}
              </div>

              {c.categories.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {c.categories.map((cat) => (
                    <span
                      key={cat}
                      className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500"
                    >
                      {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] ??
                        cat}
                    </span>
                  ))}
                </div>
              )}

              {c.description && (
                <p className="mt-2.5 line-clamp-2 text-sm text-neutral-500">
                  {c.description}
                </p>
              )}

              <div className="mt-4">
                <ApplyPanel
                  campaignId={c.id}
                  artists={artistPicker}
                  applied={c.myApplication}
                  closed={d.closed}
                />
              </div>
            </Card>
          );
        })}
        {feed.length === 0 && (
          <p className="py-12 text-center text-sm text-neutral-400">
            {t("agency.campaigns.empty")}
          </p>
        )}
      </div>
    </div>
  );
}
