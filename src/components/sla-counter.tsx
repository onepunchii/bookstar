"use client";

import { Card } from "@/components/ui/card";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp, Zap } from "lucide-react";

// 응답 SLA 지표 — DB 아티스트의 실제 평균(응답시간·응답률)만 표시.
//
// 집계값(숫자 2개)만 받는다. 예전에는 Artist[] 전체를 prop으로 받았는데,
// 클라이언트 컴포넌트라 배열이 RSC 페이로드로 직렬화돼 비공개 필드(체중·생년 등)까지
// HTML에 실렸다 — 공개 프로필의 리댁션 게이트를 우회하는 경로였다.
export function SLACounter({
  variant = "hero",
  dark = false,
  avgHours = 4.2,
  avgRate = 96,
}: {
  variant?: "hero" | "inline";
  dark?: boolean;
  avgHours?: number;
  avgRate?: number;
}) {
  const t = useT();

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center gap-4 rounded-2xl px-5 py-3.5 text-sm",
          dark ? "adv-glass" : "bg-neutral-50"
        )}
      >
        <span
          className={cn(
            "flex items-center gap-1.5",
            dark ? "text-white/55" : "text-neutral-500"
          )}
        >
          <Clock className="h-3.5 w-3.5 text-brand-500" />
          {t("sla.avgResponse")}{" "}
          <span
            className={cn("font-black", dark ? "text-white" : "text-neutral-900")}
          >
            {avgHours}
            {t("sla.hoursUnit")}
          </span>
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5",
            dark ? "text-white/55" : "text-neutral-500"
          )}
        >
          <TrendingUp className="h-3.5 w-3.5 text-brand-500" />
          {t("sla.responseRate")}{" "}
          <span
            className={cn("font-black", dark ? "text-white" : "text-neutral-900")}
          >
            {avgRate}%
          </span>
        </span>
        <span
          className={cn(
            "ml-auto flex items-center gap-1.5 text-xs",
            dark ? "text-white/50" : "text-neutral-500"
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
          </span>
          {t("sla.zeroFee")}
        </span>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6">
      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700">
        <Zap className="h-3 w-3" /> SLA
      </div>
      <p className="mt-1 text-sm font-bold text-neutral-500">
        {t("sla.agencyMetrics")}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-neutral-400">{t("sla.avgResponse")}</p>
          <p className="mt-0.5 text-2xl font-black">
            {avgHours}
            <span className="ml-0.5 text-sm font-bold text-neutral-500">
              {t("sla.hoursUnit")}
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">{t("sla.responseRate")}</p>
          <p className="mt-0.5 text-2xl font-black text-brand-600">
            {avgRate}%
          </p>
        </div>
      </div>
    </Card>
  );
}
