import Link from "next/link";
import { Eyebrow } from "@/components/premium/eyebrow";
import { Reveal } from "@/components/premium/reveal";
import { RequestsTabs } from "@/components/requests-tabs";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  getBookingRequests,
  getDemoBookingRequests,
} from "@/lib/data/booking-requests";
import { getSessionUser } from "@/lib/data/session";
import { getLastSenderMap } from "@/lib/data/messages";
import { formatBudget } from "@/lib/types";
import { getT } from "@/lib/i18n/server";
import { ChevronRight } from "lucide-react";

export default async function RequestsPage() {
  const { t } = await getT();
  const user = await getSessionUser();
  // 로그인 광고주는 본인 요청, 비로그인은 데모 샘플(실 광고주 데이터 노출 금지)
  const [requests, lastSender] = await Promise.all([
    user
      ? getBookingRequests({ companyUserId: user.id })
      : Promise.resolve(getDemoBookingRequests()),
    getLastSenderMap(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <Reveal>
        <Eyebrow>My Requests</Eyebrow>
        <h1 className="display-kr mt-3 text-3xl font-black text-white sm:text-4xl">
          {t("nav.company.requests")}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {t("requests.subtitle", { count: requests.length })}
        </p>
        <RequestsTabs />
      </Reveal>

      <div className="mt-8 space-y-3">
        {requests.map((req, i) => (
          <Reveal key={req.id} delay={(i % 6) * 50}>
            <Link href={`/requests/${req.id}`} className="group block">
              <div className="adv-card adv-card-hover flex items-center gap-4 rounded-2xl p-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-lg font-black text-white/40">
                  {req.artistName.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {req.artistName}
                    </span>
                    <Badge>{req.eventType}</Badge>
                    {lastSender[req.id] === "agency" && (
                      <Badge variant="solid">{t("requests.newReply")}</Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-white/50">
                    {req.date} · {req.location} · {t("requests.budgetLabel")}{" "}
                    {formatBudget(req.budget)}
                  </p>
                </div>
                <StatusBadge status={req.status} />
                <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
