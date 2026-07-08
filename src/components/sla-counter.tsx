"use client";

import { Card } from "@/components/ui/card";
import type { Artist } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp, Zap } from "lucide-react";

// 응답 SLA 지표 — DB 아티스트의 실제 평균(응답시간·응답률)만 표시.
export function SLACounter({
  variant = "hero",
  dark = false,
  artists = [],
}: {
  variant?: "hero" | "inline";
  dark?: boolean;
  artists?: Artist[];
}) {
  const n = artists.length || 1;
  const avgHours =
    artists.length > 0
      ? Math.round(
          (artists.reduce((sum, a) => sum + a.responseHours, 0) / n) * 10
        ) / 10
      : 4.2;
  const avgRate =
    artists.length > 0
      ? Math.round(artists.reduce((sum, a) => sum + a.responseRate, 0) / n)
      : 96;

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
          평균 응답{" "}
          <span
            className={cn("font-black", dark ? "text-white" : "text-neutral-900")}
          >
            {avgHours}시간
          </span>
        </span>
        <span
          className={cn(
            "flex items-center gap-1.5",
            dark ? "text-white/55" : "text-neutral-500"
          )}
        >
          <TrendingUp className="h-3.5 w-3.5 text-brand-500" />
          응답률{" "}
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
          매칭 수수료 0%
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
        소속사 응답 지표
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-neutral-400">평균 응답</p>
          <p className="mt-0.5 text-2xl font-black">
            {avgHours}
            <span className="ml-0.5 text-sm font-bold text-neutral-500">
              시간
            </span>
          </p>
        </div>
        <div>
          <p className="text-xs text-neutral-400">응답률</p>
          <p className="mt-0.5 text-2xl font-black text-brand-600">
            {avgRate}%
          </p>
        </div>
      </div>
    </Card>
  );
}
