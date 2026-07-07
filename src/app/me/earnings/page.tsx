import { Card } from "@/components/ui/card";
import { SETTLEMENTS } from "@/lib/mock-data";
import { formatBudget, settlementBreakdown } from "@/lib/types";
import { cn } from "@/lib/utils";

const ME_ID = "a5"; // 정하늘

const STATUS_LABEL = {
  paid: "지급 완료",
  pending: "지급 예정",
  overdue: "지연",
} as const;

export default function MyEarningsPage() {
  const mine = SETTLEMENTS.filter((s) => s.artistId === ME_ID);
  const totalNet = mine.reduce(
    (sum, s) => sum + settlementBreakdown(s).artistNet,
    0
  );
  const paidNet = mine
    .filter((s) => s.status === "paid")
    .reduce((sum, s) => sum + settlementBreakdown(s).artistNet, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black tracking-tight">내 정산</h1>
      <p className="mt-1 text-sm text-neutral-500">
        건별 출연료와 분배 내역을 투명하게 확인하세요
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">올해 실수령</p>
          <p className="mt-1 text-2xl font-black text-brand-600">
            {totalNet.toLocaleString()}만원
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-bold text-neutral-500">지급 완료</p>
          <p className="mt-1 text-2xl font-black">
            {paidNet.toLocaleString()}만원
          </p>
        </Card>
      </div>

      <div className="mt-6 space-y-3">
        {mine.map((s) => {
          const b = settlementBreakdown(s);
          return (
            <Card key={s.id} className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{s.eventTitle}</p>
                  <p className="mt-0.5 text-xs text-neutral-400">{s.date}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                    s.status === "paid"
                      ? "bg-neutral-100 text-neutral-500"
                      : s.status === "pending"
                        ? "bg-neutral-900 text-white"
                        : "bg-brand-500 text-white"
                  )}
                >
                  {STATUS_LABEL[s.status]}
                </span>
              </div>
              <div className="mt-4 space-y-1.5 rounded-xl bg-neutral-50 p-4 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>총 출연료</span>
                  <span className="font-semibold text-neutral-900">
                    {formatBudget(s.gross)}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>소속사 분배 ({Math.round(s.agencyRate * 100)}%)</span>
                  <span>-{formatBudget(b.agencyShare)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>원천징수 (3.3%)</span>
                  <span>-{b.withholding.toLocaleString()}만원</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 font-bold">
                  <span>실수령액</span>
                  <span className="text-brand-600">
                    {b.artistNet.toLocaleString()}만원
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
