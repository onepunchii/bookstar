import { notFound } from "next/navigation";
import { LeaveReviewCard } from "@/components/leave-review-card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { getBookingRequests } from "@/lib/data/booking-requests";
import { getMessages } from "@/lib/data/messages";
import { getLatestQuote } from "@/lib/data/quotes";
import { formatBudget } from "@/lib/types";
import { RequestThread } from "./request-thread";
import { cn } from "@/lib/utils";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const requests = await getBookingRequests();
  const request = requests.find((r) => r.id === id);
  if (!request) notFound();
  const [thread, quote] = await Promise.all([
    getMessages(id),
    getLatestQuote(id),
  ]);

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
          {request.date} · {request.location} · 제안 예산{" "}
          {formatBudget(request.budget)}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Thread */}
          <div className="lg:col-span-2">
            <RequestThread requestId={id} initialMessages={thread} />
          </div>

          {/* Summary sidebar */}
          <div className="space-y-4">
            <div className="adv-card rounded-2xl p-5">
              <h3 className="text-sm font-bold text-white">요청 내용</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                {request.message}
              </p>
            </div>

            {quote && (
              <div className="adv-card rounded-2xl p-5 ring-1 ring-brand-500/30">
                <h3 className="text-sm font-bold text-brand-300">최근 견적</h3>
                <p className="mt-2 text-2xl font-black text-white">
                  {formatBudget(quote.amount)}
                </p>
                {quote.includes && (
                  <p className="mt-1 text-xs text-white/50">
                    포함: {quote.includes}
                  </p>
                )}
                {quote.note && (
                  <p className="mt-1 text-xs text-white/45">{quote.note}</p>
                )}
                <p className="mt-3 text-xs text-white/40">
                  견적 수락 시 전자계약 단계로 넘어갑니다 (2차 오픈 예정)
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
              <h3 className="text-sm font-bold text-white">진행 단계</h3>
              <ol className="mt-3 space-y-2 text-sm">
                {["요청 발송", "소속사 검토", "협의", "계약", "완료"].map(
                  (step, i) => {
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
