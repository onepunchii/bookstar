import { AVAILABILITY_LABELS, type ScheduleDay } from "@/lib/types";
import { cn } from "@/lib/utils";

const DOW = ["일", "월", "화", "수", "목", "금", "토"];

const CELL_STYLES: Record<ScheduleDay["availability"], string> = {
  available: "bg-brand-500 text-white",
  partial: "bg-brand-100 text-brand-700",
  hold: "bg-neutral-200 text-neutral-500",
  busy: "bg-neutral-50 text-neutral-300",
};

export function AvailabilityCalendar({
  days,
  monthLabel,
  firstDayOffset,
}: {
  days: ScheduleDay[];
  monthLabel: string;
  firstDayOffset: number; // 1일의 요일 (0=일)
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-bold">{monthLabel}</h3>
        <div className="flex gap-3 text-xs text-neutral-500">
          {(
            Object.keys(CELL_STYLES) as ScheduleDay["availability"][]
          ).map((k) => (
            <span key={k} className="flex items-center gap-1">
              <span className={cn("h-2.5 w-2.5 rounded", CELL_STYLES[k])} />
              {AVAILABILITY_LABELS[k]}
            </span>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {DOW.map((d) => (
          <div
            key={d}
            className="pb-1 text-center text-xs font-medium text-neutral-400"
          >
            {d}
          </div>
        ))}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {days.map((day) => {
          const dayNum = Number(day.date.slice(-2));
          return (
            <div
              key={day.date}
              title={`${dayNum}일 ${AVAILABILITY_LABELS[day.availability]}${day.note ? ` · ${day.note}` : ""}`}
              className={cn(
                "flex h-11 flex-col items-center justify-center rounded-lg text-sm font-medium",
                CELL_STYLES[day.availability]
              )}
            >
              {dayNum}
              {day.note && <span className="text-[9px] leading-none">오전</span>}
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-neutral-400">
        가능 여부만 공개됩니다. 상세 일정·장소는 소속사만 확인할 수 있어요.
      </p>
    </div>
  );
}
