"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DAY_SCHEDULES } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import {
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MessageCircle,
  UserRound,
} from "lucide-react";

const DATES = ["2026-07-07", "2026-07-08", "2026-07-09"];

function formatDate(date: string): string {
  const d = new Date(date);
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`;
}

export function DaySheet() {
  const [dateIdx, setDateIdx] = useState(0);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const date = DATES[dateIdx];
  const schedules = DAY_SCHEDULES.filter((s) => s.date === date);

  const sendAll = () =>
    setSent((prev) => ({
      ...prev,
      ...Object.fromEntries(schedules.map((s) => [s.id, true])),
    }));

  return (
    <div>
      {/* 날짜 네비 + 전체 전파 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateIdx((i) => Math.max(0, i - 1))}
            disabled={dateIdx === 0}
            aria-label="이전 날짜"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-900 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-36 text-center text-lg font-black">
            {formatDate(date)}
            {dateIdx === 0 && (
              <span className="ml-1.5 align-middle text-xs font-bold text-brand-500">
                오늘
              </span>
            )}
          </h2>
          <button
            onClick={() => setDateIdx((i) => Math.min(DATES.length - 1, i + 1))}
            disabled={dateIdx === DATES.length - 1}
            aria-label="다음 날짜"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-900 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        {schedules.length > 0 && (
          <button
            onClick={sendAll}
            className="flex h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
          >
            <MessageCircle className="h-4 w-4" /> 전체 카톡 전파
          </button>
        )}
      </div>

      {schedules.length === 0 ? (
        <Card className="flex h-48 flex-col items-center justify-center gap-2 text-neutral-400">
          <p className="font-semibold">이 날은 등록된 스케줄이 없어요</p>
          <p className="text-sm">확정된 섭외는 자동으로 데일리에 내려옵니다</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-brand-50 text-lg font-black text-neutral-300">
                    {s.artistName.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{s.artistName}</span>
                      <Badge>{s.eventType}</Badge>
                    </div>
                    <p className="text-sm text-neutral-500">{s.title}</p>
                  </div>
                </div>
                {sent[s.id] ? (
                  <span className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-500">
                    <Check className="h-3.5 w-3.5 text-brand-500" /> 전파됨 ·
                    읽음 2/3
                  </span>
                ) : (
                  <button
                    onClick={() =>
                      setSent((prev) => ({ ...prev, [s.id]: true }))
                    }
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:border-brand-500 hover:text-brand-600"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> 카톡 전파
                  </button>
                )}
              </div>

              {/* 타임라인 */}
              <div className="mt-5 overflow-x-auto pb-1">
                <div className="flex min-w-max items-stretch gap-0">
                  {s.stops.map((stop, i) => (
                    <div key={i} className="flex items-stretch">
                      <div
                        className={cn(
                          "w-36 rounded-xl border p-3",
                          i === 0
                            ? "border-brand-200 bg-brand-50/60"
                            : "border-neutral-100 bg-neutral-50/60"
                        )}
                      >
                        <p
                          className={cn(
                            "text-sm font-black",
                            i === 0 ? "text-brand-600" : "text-neutral-900"
                          )}
                        >
                          {stop.time}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold">
                          {stop.label}
                        </p>
                        {stop.location && (
                          <p className="mt-1 flex items-start gap-1 text-xs text-neutral-500">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                            {stop.location}
                          </p>
                        )}
                      </div>
                      {i < s.stops.length - 1 && (
                        <div className="flex w-6 items-center justify-center">
                          <div className="h-px w-full bg-neutral-200" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 담당/차량/메모 */}
              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-neutral-100 pt-3 text-sm text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <UserRound className="h-3.5 w-3.5 text-neutral-400" />
                  {s.manager}
                </span>
                {s.vehicle && (
                  <span className="flex items-center gap-1.5">
                    <Car className="h-3.5 w-3.5 text-neutral-400" />
                    {s.vehicle}
                  </span>
                )}
                {s.memo && (
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700">
                    {s.memo}
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
