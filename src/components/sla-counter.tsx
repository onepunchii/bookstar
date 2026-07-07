"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ARTISTS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import { Clock, TrendingUp, Zap } from "lucide-react";

// 최근 응답 로그 (mock) — 실 데이터 붙기 전까지 회전 피드
const RECENT_RESPONSES = [
  { name: "리센느", agency: "웨이크원", ago: "방금 전" },
  { name: "이준호", agency: "JH컴퍼니", ago: "3분 전" },
  { name: "정하늘", agency: "샌드박스", ago: "12분 전" },
  { name: "박도현", agency: "에스팀", ago: "27분 전" },
  { name: "최민아", agency: "크리에이티브랩", ago: "42분 전" },
  { name: "QWER", agency: "타마고", ago: "1시간 전" },
];

export function SLACounter({
  variant = "hero",
  dark = false,
}: {
  variant?: "hero" | "inline";
  dark?: boolean;
}) {
  const [idx, setIdx] = useState(0);
  const avgHours =
    Math.round(
      (ARTISTS.reduce((sum, a) => sum + a.responseHours, 0) / ARTISTS.length) *
        10
    ) / 10;
  const avgRate = Math.round(
    ARTISTS.reduce((sum, a) => sum + a.responseRate, 0) / ARTISTS.length
  );
  const todayCount = 8; // demo: 오늘 응답 완료 수

  useEffect(() => {
    const t = setInterval(
      () => setIdx((i) => (i + 1) % RECENT_RESPONSES.length),
      2400
    );
    return () => clearInterval(t);
  }, []);

  const current = RECENT_RESPONSES[idx];

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
          <span className={cn("font-black", dark ? "text-white" : "text-neutral-900")}>
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
          <span className={cn("font-black", dark ? "text-white" : "text-neutral-900")}>
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
          <span className="font-medium">{current.name}</span>
          <span>· {current.ago} 응답</span>
        </span>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6">
      <div className="flex items-center gap-1.5 text-xs font-bold text-brand-700">
        <Zap className="h-3 w-3" /> LIVE
      </div>
      <p className="mt-1 text-sm font-bold text-neutral-500">
        지금 소속사들이 응답 중
      </p>
      <div className="mt-4 grid grid-cols-3 gap-4">
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
        <div>
          <p className="text-xs text-neutral-400">오늘 응답</p>
          <p className="mt-0.5 text-2xl font-black">
            {todayCount}
            <span className="ml-0.5 text-sm font-bold text-neutral-500">
              건
            </span>
          </p>
        </div>
      </div>

      {/* 회전 피드 */}
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-neutral-200/70">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
        </span>
        <span
          key={current.name}
          className={cn(
            "min-w-0 flex-1 truncate text-sm",
            "animate-in fade-in slide-in-from-bottom-1 duration-500"
          )}
        >
          <span className="font-bold">{current.name}</span>
          <span className="ml-1 text-neutral-500">
            ({current.agency}) · {current.ago}
          </span>
        </span>
      </div>
    </Card>
  );
}
