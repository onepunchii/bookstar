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
import { CalendarClock, MapPin, Sparkles } from "lucide-react";
import { StartAgencyButton } from "../start-agency-button";
import { ApplyPanel } from "./apply-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "오픈 캠페인" };

export default async function AgencyCampaignsPage() {
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
          👀 <span className="font-bold">테스터 보기</span> — 소속사로 시작하면
          내 아티스트로 실제 지원할 수 있어요.
          <div>
            <StartAgencyButton />
          </div>
        </div>
      )}

      <div className="mb-5">
        <h1 className="text-xl font-black tracking-tight text-neutral-900">
          오픈 캠페인
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          광고주가 올린 섭외 건에 우리 아티스트로 직접 지원하세요 · {feed.length}건
          모집 중
        </p>
      </div>

      <div className="space-y-3">
        {feed.map((c) => {
          const d = dday(c.deadline);
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600">
                  {c.eventType}
                </span>
                {c.matched && (
                  <span className="flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold text-brand-600">
                    <Sparkles className="h-3 w-3" /> 적합
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
            지금 모집 중인 오픈 캠페인이 없어요. 광고주가 캠페인을 올리면 여기에
            떠요.
          </p>
        )}
      </div>
    </div>
  );
}
