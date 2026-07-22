import { notFound } from "next/navigation";
import { LeaveReviewCard } from "@/components/leave-review-card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  getBookingRequestById,
  getRequestParties,
} from "@/lib/data/booking-requests";
import { getSessionUser, getSessionAgency } from "@/lib/data/session";
import { agencyUserForArtist } from "@/lib/data/notify";
import { getMessages } from "@/lib/data/messages";
import { getLatestQuote } from "@/lib/data/quotes";
import { formatBudget } from "@/lib/types";
import { RequestThread } from "./request-thread";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { t, locale } = await getT();

  // 접근 통제(fail-closed) — 당사자(광고주 본인·담당 소속사)만 열람.
  // 요청을 못 찾거나 조회 실패면 notFound(협의 채팅·견적·회사명 등 민감정보 보호).
  const parties = await getRequestParties(id);
  if (!parties) notFound();
  const [user, agency] = await Promise.all([
    getSessionUser(),
    getSessionAgency(),
  ]);
  const isParticipant =
    !!user &&
    (parties.companyUserId === user.id ||
      (!!agency && parties.agencyId === agency.id));
  if (!isParticipant) notFound();

  const request = await getBookingRequestById(id);
  if (!request) notFound();
  const [thread, quote] = await Promise.all([
    getMessages(id),
    getLatestQuote(id),
  ]);

  // 협의 상대 유저 — 신고·차단 메뉴 대상 (내가 광고주면 소속사 대표, 소속사면 광고주)
  const counterpartUserId =
    parties.companyUserId === user.id
      ? await agencyUserForArtist(parties.artistId)
      : parties.companyUserId;

  return (
    <div className="adv-dark min-h-dvh">
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="display-kr text-3xl font-black text-white">
            {request.artistName}
          </h1>
          <Badge>{request.eventType}</Badge>
          <StatusBadge status={request.status} />
        </div>
        <p className="mt-2 text-sm text-white/50">
          {t("requests.detail.meta", {
            date: request.date,
            location: request.location,
            budget: formatBudget(request.budget, locale),
          })}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Thread */}
          <div className="lg:col-span-2">
            <RequestThread
              requestId={id}
              initialMessages={thread}
              counterpartUserId={counterpartUserId}
            />
          </div>

          {/* Summary sidebar */}
          <div className="space-y-4">
            <div className="adv-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white">
                {t("requests.detail.requestContent")}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {request.message}
              </p>
            </div>

            {quote && (
              <div className="adv-card rounded-2xl p-5 ring-1 ring-brand-500/30">
                <h3 className="text-sm font-bold text-brand-300">
                  {t("requests.detail.latestQuote")}
                </h3>
                <p className="mt-2 text-2xl font-black text-white">
                  {formatBudget(quote.amount, locale)}
                </p>
                {quote.includes && (
                  <p className="mt-1 text-xs text-white/50">
                    {t("requests.detail.includes", { includes: quote.includes })}
                  </p>
                )}
                {quote.note && (
                  <p className="mt-1 text-xs text-white/45">{quote.note}</p>
                )}
                <p className="mt-3 text-xs text-white/40">
                  {t("requests.detail.quoteAcceptNote")}
                </p>
              </div>
            )}

            {(request.status === "accepted" ||
              request.status === "completed") && (
              <LeaveReviewCard
                artistId={request.artistId}
                artistName={request.artistName}
                companyName={request.companyName}
                eventTitle={`${request.eventType} · ${request.date}`}
                dark
              />
            )}

            <div className="adv-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white">
                {t("requests.detail.progressTitle")}
              </h3>
              <ol className="mt-3 space-y-2 text-sm">
                {[
                  t("requests.detail.stepSent"),
                  t("requests.detail.stepReview"),
                  t("requests.detail.stepNegotiate"),
                  t("requests.detail.stepContract"),
                  t("requests.detail.stepDone"),
                ].map((step, i) => {
                    const activeIdx =
                      request.status === "pending"
                        ? 0
                        : request.status === "reviewing"
                          ? 1
                          : request.status === "negotiating"
                            ? 2
                            : request.status === "accepted"
                              ? 3
                              : 4;
                    return (
                      <li key={step} className="flex items-center gap-2.5">
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                            i <= activeIdx
                              ? "bg-brand-500 text-white"
                              : "bg-white/8 text-white/35"
                          )}
                        >
                          {i + 1}
                        </span>
                        <span
                          className={
                            i <= activeIdx
                              ? "font-medium text-white"
                              : "text-white/35"
                          }
                        >
                          {step}
                        </span>
                      </li>
                    );
                  }
                )}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
