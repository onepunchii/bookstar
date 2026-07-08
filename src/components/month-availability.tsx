"use client";

// 가용 캘린더 월 이동 래퍼 — 이번달부터 미래(monthsAhead)까지만.
// 행사는 미리 잡으므로 지난달은 표시하지 않는다.
import { useState } from "react";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { todayKST } from "@/lib/date";
import type { ScheduleDay } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function MonthAvailability({
  schedule,
  dark = false,
  monthsAhead = 2,
}: {
  schedule: ScheduleDay[];
  dark?: boolean;
  monthsAhead?: number; // 이번달 + N개월
}) {
  const t = todayKST();
  const baseY = Number(t.slice(0, 4));
  const baseM = Number(t.slice(5, 7));
  const [offset, setOffset] = useState(0); // 0=이번달

  const d = new Date(baseY, baseM - 1 + offset, 1);
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const key = `${y}-${String(m).padStart(2, "0")}`;
  const daysInMonth = new Date(y, m, 0).getDate();
  const firstOffset = new Date(`${key}-01T00:00:00`).getDay();

  const byDate = new Map(schedule.map((s) => [s.date, s]));
  const days: ScheduleDay[] = Array.from({ length: daysInMonth }, (_, i) => {
    const date = `${key}-${String(i + 1).padStart(2, "0")}`;
    const base = byDate.get(date);
    return {
      date,
      availability: base?.availability ?? "hold", // 미등록 = 협의 필요
      note: base?.note,
    };
  });

  const btn = cn(
    "flex h-7 w-7 items-center justify-center rounded-lg transition-colors disabled:opacity-25",
    dark
      ? "text-white/60 ring-1 ring-white/15 hover:text-white"
      : "text-neutral-500 ring-1 ring-neutral-200 hover:text-neutral-900"
  );

  return (
    <div>
      {/* 월 이동 — 이번달부터 앞으로만 */}
      <div className="mb-2 flex items-center justify-end gap-1">
        <button
          onClick={() => setOffset((v) => Math.max(0, v - 1))}
          disabled={offset === 0}
          aria-label="이전 달"
          className={btn}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span
          className={cn(
            "px-1 text-xs font-semibold tabular-nums",
            dark ? "text-white/45" : "text-neutral-400"
          )}
        >
          {offset + 1}/{monthsAhead + 1}
        </span>
        <button
          onClick={() => setOffset((v) => Math.min(monthsAhead, v + 1))}
          disabled={offset === monthsAhead}
          aria-label="다음 달"
          className={btn}
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <AvailabilityCalendar
        days={days}
        monthLabel={`${y}년 ${m}월`}
        firstDayOffset={firstOffset}
        dark={dark}
      />
    </div>
  );
}
