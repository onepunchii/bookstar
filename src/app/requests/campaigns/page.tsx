import Link from "next/link";
import { Eyebrow } from "@/components/premium/eyebrow";
import { Reveal } from "@/components/premium/reveal";
import { RequestsTabs } from "@/components/requests-tabs";
import { getCompanyCampaigns } from "@/lib/data/campaigns";
import { getSessionUser } from "@/lib/data/session";
import {
  CAMPAIGN_STATUS_LABEL,
  dday,
  formatBudgetRange,
} from "@/lib/campaign-options";
import { cn } from "@/lib/utils";
import { ChevronRight, Users } from "lucide-react";
import { NewCampaignPanel } from "./new-campaign-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "오픈 캠페인" };

export default async function CompanyCampaignsPage() {
  const user = await getSessionUser();
  const campaigns = user ? await getCompanyCampaigns(user.id) : [];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <Reveal>
        <Eyebrow>Open Casting</Eyebrow>
        <h1 className="display-kr mt-3 text-3xl font-black text-white sm:text-4xl">
          섭외 관리
        </h1>
        <p className="mt-2 text-sm text-white/50">
          캠페인을 올리면 맞는 아티스트·기획사가 직접 지원해요.
        </p>
        <RequestsTabs />
      </Reveal>

      <div className="mt-8">
        <NewCampaignPanel loggedIn={!!user} />
      </div>

      <div className="mt-4 space-y-3">
        {campaigns.map((c, i) => {
          const d = dday(c.deadline);
          return (
            <Reveal key={c.id} delay={(i % 6) * 50}>
              <Link href={`/requests/campaigns/${c.id}`} className="group block">
                <div className="adv-card adv-card-hover rounded-2xl p-5">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-semibold text-white/70">
                      {c.eventType}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                        c.status === "awarded"
                          ? "bg-emerald-500/15 text-emerald-300"
                          : c.status === "open"
                            ? "bg-brand-500/15 text-brand-300"
                            : "bg-white/8 text-white/40"
                      )}
                    >
                      {CAMPAIGN_STATUS_LABEL[c.status]}
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
                    <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-white/25" />
                  </div>
                  <p className="mt-2.5 font-bold text-white">{c.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/50">
                    <span>{formatBudgetRange(c.budgetMin, c.budgetMax)}</span>
                    <span className="flex items-center gap-1 text-white/60">
                      <Users className="h-3.5 w-3.5" /> 지원 {c.applicantCount}
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          );
        })}
        {user && campaigns.length === 0 && (
          <p className="py-10 text-center text-sm text-white/35">
            아직 올린 캠페인이 없어요. 위에서 첫 캠페인을 만들어보세요.
          </p>
        )}
      </div>
    </div>
  );
}
