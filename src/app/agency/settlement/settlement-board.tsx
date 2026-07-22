"use client";

import { useState } from "react";
import { SettlementEditor } from "@/components/settlement-editor";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  formatBudget,
  settlementBreakdown,
  type Artist,
  type Settlement,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { BellRing, Check, FileText, Plus } from "lucide-react";

const STATUS_STYLE = {
  paid: "bg-neutral-100 text-neutral-500",
  pending: "bg-neutral-900 text-white",
  overdue: "bg-brand-500 text-white",
} as const;

export function SettlementBoard({
  initialSettlements,
  artists,
}: {
  initialSettlements: Settlement[];
  artists: Artist[];
}) {
  const t = useT();
  const [reminded, setReminded] = useState<Record<string, boolean>>({});
  const [editorOpen, setEditorOpen] = useState(false);
  const [visible, setVisible] = useState<Settlement[]>(initialSettlements);

  // 세금계산서 발행 → DB PATCH + 로컬 반영
  const markInvoice = (id: string) => {
    setVisible((prev) =>
      prev.map((s) => (s.id === id ? { ...s, taxInvoice: true } : s))
    );
    fetch("/api/settlements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, taxInvoice: true }),
    }).catch(() => {});
  };

  const handleCreated = (created: Settlement) => {
    setVisible((prev) => [created, ...prev]);
  };

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
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-500">
            {t("agency.settlement.subtitle", { n: visible.length })}
          </p>
        </div>
        <button
          onClick={() => setEditorOpen(true)}
          className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus className="h-4 w-4" /> {t("agency.settlement.newCta")}
        </button>
      </div>

      {/* 요약 */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: t("agency.settlement.kpiTotal"), value: formatBudget(total) },
          { label: t("agency.settlement.kpiPending"), value: formatBudget(pending) },
          {
            label: t("agency.settlement.kpiOverdue"),
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
          const hasInvoice = s.taxInvoice;
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
                      {t(`agency.settlement.status.${s.status}`)}
                    </span>
                    {hasInvoice && (
                      <Badge variant="outline">
                        <FileText className="h-3 w-3" /> {t("agency.settlement.taxInvoice")}
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
                      onClick={() => markInvoice(s.id)}
                      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:border-neutral-900"
                    >
                      <FileText className="h-3.5 w-3.5" /> {t("agency.settlement.taxInvoice")}
                    </button>
                  )}
                  {s.status === "overdue" &&
                    (reminded[s.id] ? (
                      <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-500">
                        <Check className="h-3.5 w-3.5 text-brand-500" />{" "}
                        {t("agency.settlement.reminderSent")}
                      </span>
                    ) : (
                      <button
                        onClick={() =>
                          setReminded((prev) => ({ ...prev, [s.id]: true }))
                        }
                        className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-brand-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
                      >
                        <BellRing className="h-3.5 w-3.5" /> {t("agency.settlement.remindPayment")}
                      </button>
                    ))}
                </div>
              </div>

              {/* 분배 내역 */}
              <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-neutral-50 p-4 text-sm sm:grid-cols-5">
                <div>
                  <p className="text-xs text-neutral-400">{t("agency.settlement.grossLabel")}</p>
                  <p className="mt-0.5 font-bold">{formatBudget(s.gross)}</p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">
                    {t("agency.settlement.agencyShareLabel", { rate: Math.round(s.agencyRate * 100) })}
                  </p>
                  <p className="mt-0.5 font-bold">
                    {formatBudget(b.agencyShare)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">
                    {t("agency.settlement.artistShareLabel", { rate: Math.round((1 - s.agencyRate) * 100) })}
                  </p>
                  <p className="mt-0.5 font-bold">
                    {formatBudget(b.artistGross)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">{t("agency.settlement.withholdingLabel")}</p>
                  <p className="mt-0.5 font-bold text-neutral-500">
                    -{t("agency.settlement.manwon", { value: b.withholding.toLocaleString() })}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-400">{t("agency.settlement.netLabel")}</p>
                  <p className="mt-0.5 font-black text-brand-600">
                    {t("agency.settlement.manwon", { value: b.artistNet.toLocaleString() })}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        {t("agency.settlement.footnote")}
      </p>

      {editorOpen && (
        <SettlementEditor
          artists={artists}
          onCreated={handleCreated}
          onClose={() => setEditorOpen(false)}
        />
      )}
    </div>
  );
}
