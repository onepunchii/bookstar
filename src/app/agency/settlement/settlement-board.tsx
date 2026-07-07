"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SETTLEMENTS } from "@/lib/mock-data";
import { useScopedArtistIds } from "@/lib/scope-store";
import { formatBudget, settlementBreakdown } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BellRing, Check, FileText } from "lucide-react";

const STATUS_LABEL = {
  paid: "지급 완료",
  pending: "지급 대기",
  overdue: "미수금",
} as const;

const STATUS_STYLE = {
  paid: "bg-neutral-100 text-neutral-500",
  pending: "bg-neutral-900 text-white",
  overdue: "bg-brand-500 text-white",
} as const;

export function SettlementBoard() {
  const [reminded, setReminded] = useState<Record<string, boolean>>({});
  const [invoiced, setInvoiced] = useState<Record<string, boolean>>({});

  const scopedIds = useScopedArtistIds();
  const visible = scopedIds
    ? SETTLEMENTS.filter((s) => scopedIds.has(s.artistId))
    : SETTLEMENTS;

  const total = visible.reduce((sum, s) => sum + s.gross, 0);
  const pending = visible.filter((s) => s.status === "pending").reduce(
    (sum, s) => sum + s.gross,
    0
  );
  const overdue = visible.filter((s) => s.status === "overdue").reduce(
    (sum, s) => sum + s.gross,
    0
  );

  return (
    <div>
      {/* 요약 */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "이번 분기 총 정산", value: formatBudget(total) },
          { label: "지급 대기", value: formatBudget(pending) },
          {
            label: "미수금",
            value: formatBudget(overdue),
            highlight: overdue > 0,
          },
        ].map((kpi) => (
          <Card
            key={kpi.label}
            className={cn("p-5", kpi.highlight && "border-brand-200 bg-brand-50/40")}
          >
            <p className="text-sm font-bold text-neutral-500">{kpi.label}</p>
            <p
              className={cn(
                "mt-1 text-2xl font-black",
                kpi.highlight && "text-brand-600"
              )}
            >
              {kpi.value}
            </p>
          </Card>
        ))}
      </div>

      {/* 정산 목록 */}
      <div className="space-y-3">
        {visible.map((s) => {
          const b = settlementBreakdown(s);
          const hasInvoice = s.taxInvoice || invoiced[s.id];
          return (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{s.artistName}</span>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        STATUS_STYLE[s.status]
                      )}
                    >
                      {STATUS_LABEL[s.status]}
                    </span>
                    {hasInvoice && (
                      <Badge variant="outline">
                        <FileText className="h-3 w-3" /> 세금계산서 발행
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-neutral-500">
                    {s.eventTitle} · {s.date}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!hasInvoice && (
                    <button
                      onClick={() =>
                        setInvoiced((prev) => ({ ...prev, [s.id]: true }))
                      }
                      className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:border-neutral-900"
                    >
                      <FileText className="h-3.5 w-3.5" /> 세금계산서 발행
                    </button>
                  )}
                  {s.status === "overdue" &&
                    (reminded[s.id] ? (
                      <span className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-500">
                        <Check className="h-3.5 w-3.5 text-brand-500" />{" "}
                        리마인더 발송됨
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          setReminded((prev) => ({ ...prev, [s.id]: true }))
                        }
                        className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
                      >
                        <BellRing className="h-3.5 w-3.5" /> 입금 리마인더
                      </button>
                    ))}
                </div>
              </div>

              {/* 분배 내역 */}
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-neutral-50 p-4 text-sm sm:grid-cols-5">
                <div>
                  <p className="text-xs text-neutral-400">총 출연료</p>
                  <p className="mt-0.5 font-bold">{formatBudget(s.gross)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">
                    소속사 ({Math.round(s.agencyRate * 100)}%)
                  </p>
                  <p className="mt-0.5 font-bold">
                    {formatBudget(b.agencyShare)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">
                    아티스트 ({Math.round((1 - s.agencyRate) * 100)}%)
                  </p>
                  <p className="mt-0.5 font-bold">
                    {formatBudget(b.artistGross)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">원천징수 3.3%</p>
                  <p className="mt-0.5 font-bold text-neutral-500">
                    -{b.withholding.toLocaleString()}만원
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">실지급액</p>
                  <p className="mt-0.5 font-black text-brand-600">
                    {b.artistNet.toLocaleString()}만원
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        분배율은 아티스트별 계약 조건에 따라 설정됩니다. 정산 내역은 아티스트
        계정에도 동일하게 공개돼요.
      </p>
    </div>
  );
}
