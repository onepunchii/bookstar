import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/premium/reveal";
import { getCompanyCampaign } from "@/lib/data/campaigns";
import { getSessionUser } from "@/lib/data/session";
import { dday, formatBudgetRange } from "@/lib/campaign-options";
import { CATEGORY_LABELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { ArrowLeft, CalendarClock, MapPin, Users } from "lucide-react";
import { SelectApplicants } from "./select-applicants";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, locale } = await getT();
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) notFound();
  const data = await getCompanyCampaign(id, user.id);
  if (!data) notFound();
  const { campaign: c, applicants } = data;
  const d = dday(c.deadline, {
    closed: t("campaign.deadlineClosed"),
    today: t("campaign.deadlineToday"),
  });
  const awarded = c.status === "awarded";

  return (
    <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
      <Link
        href="/requests/campaigns"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> {t("requests.campaigns.openCampaigns")}
      </Link>

      <Reveal>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-semibold text-white/70">
            {c.eventType}
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
              awarded
                ? "bg-emerald-500/15 text-emerald-300"
                : c.status === "open"
                  ? "bg-brand-500/15 text-brand-300"
                  : "bg-white/8 text-white/40"
            )}
          >
            {t(`campaignStatus.${c.status}`)}
          </span>
          {c.status === "open" && (
            <span
              className={cn(
                "text-[11px] font-bold tabular-nums",
                d.urgent ? "text-brand-400" : "text-white/40"
              )}
            >
              {d.label}
            </span>
          )}
        </div>
        <h1 className="display-kr mt-3 text-2xl font-black text-white sm:text-3xl">
          {c.title}
        </h1>

        {c.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.imageUrl}
            alt=""
            className="mt-5 h-56 w-full rounded-2xl object-cover ring-1 ring-white/10"
          />
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="adv-card rounded-xl p-4">
            <p className="text-[11px] text-white/40">{t("requests.campaigns.budget")}</p>
            <p className="mt-1 text-sm font-bold text-white">
              {formatBudgetRange(
                c.budgetMin,
                c.budgetMax,
                locale,
                t("campaign.budgetNegotiable")
              )}
            </p>
          </div>
          <div className="adv-card rounded-xl p-4">
            <p className="flex items-center gap-1 text-[11px] text-white/40">
              <CalendarClock className="h-3 w-3" /> {t("requests.campaigns.applicationDeadline")}
            </p>
            <p className="mt-1 text-sm font-bold text-white">{c.deadline}</p>
          </div>
          <div className="adv-card rounded-xl p-4">
            <p className="flex items-center gap-1 text-[11px] text-white/40">
              <Users className="h-3 w-3" /> {t("requests.campaigns.applicants")}
            </p>
            <p className="mt-1 text-sm font-bold text-white">
              {t("requests.campaigns.applicantCount", { count: applicants.length })}
            </p>
          </div>
        </div>

        {(c.categories.length > 0 || c.eventDate || c.location) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/50">
            {c.categories.map((cat) => (
              <span
                key={cat}
                className="rounded-full bg-brand-500/10 px-2.5 py-1 font-semibold text-brand-300"
              >
                {CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]
                  ? t(`category.${cat}`)
                  : cat}
              </span>
            ))}
            {c.eventDate && (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3 w-3" /> {t("requests.campaigns.scheduled", { date: c.eventDate })}
              </span>
            )}
            {c.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {c.location}
              </span>
            )}
          </div>
        )}

        {c.description && (
          <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-white/[0.03] p-4 text-sm leading-relaxed text-white/70">
            {c.description}
          </p>
        )}
      </Reveal>

      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-lg font-black text-white">{t("requests.campaigns.applicants")}</h2>
          {awarded && (
            <span className="text-xs font-semibold text-emerald-300">
              {t("requests.campaigns.selectionComplete")}
            </span>
          )}
        </div>
        <SelectApplicants
          campaignId={c.id}
          applicants={applicants}
          awarded={awarded}
        />
      </div>
    </div>
  );
}
