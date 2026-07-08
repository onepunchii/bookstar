import Link from "next/link";
import { Eyebrow } from "@/components/premium/eyebrow";
import { Reveal } from "@/components/premium/reveal";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { getBookingRequests } from "@/lib/data/booking-requests";
import { getSessionUser } from "@/lib/data/session";
import { getLastSenderMap } from "@/lib/data/messages";
import { formatBudget } from "@/lib/types";
import { ChevronRight } from "lucide-react";

export default async function RequestsPage() {
  const user = await getSessionUser();
  const [requests, lastSender] = await Promise.all([
    getBookingRequests(user ? { companyUserId: user.id } : undefined),
    getLastSenderMap(),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
      <Reveal>
        <Eyebrow>My Requests</Eyebrow>
        <h1 className="display-kr mt-3 text-3xl font-black text-white sm:text-4xl">
          섭외 관리
        </h1>
        <p className="mt-2 text-sm text-white/50">
          보낸 요청의 진행 상황을 한눈에 확인하세요 · 총 {requests.length}건
        </p>
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
                      <Badge variant="solid">새 답장</Badge>
                    )}
                  </div>
                  <p className="mt-1 truncate text-sm text-white/50">
                    {req.date} · {req.location} · 예산 {formatBudget(req.budget)}
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
