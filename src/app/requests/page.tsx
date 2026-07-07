import Link from "next/link";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BOOKING_REQUESTS } from "@/lib/mock-data";
import { formatBudget } from "@/lib/types";
import { ChevronRight } from "lucide-react";

export default function RequestsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">섭외 관리</h1>
      <p className="mt-1 text-sm text-neutral-500">
        보낸 요청의 진행 상황을 한눈에 확인하세요
      </p>

      <div className="mt-8 space-y-3">
        {BOOKING_REQUESTS.map((req) => (
          <Link key={req.id} href={`/requests/${req.id}`} className="block">
            <Card className="flex items-center gap-4 p-5 transition-colors hover:border-neutral-900">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-brand-50 text-lg font-black text-neutral-300">
                {req.artistName.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold">{req.artistName}</span>
                  <Badge>{req.eventType}</Badge>
                  {req.unreadCount ? (
                    <Badge variant="solid">새 메시지 {req.unreadCount}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-sm text-neutral-500">
                  {req.date} · {req.location} · 예산{" "}
                  {formatBudget(req.budget)}
                </p>
              </div>
              <StatusBadge status={req.status} />
              <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
