"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DayScheduleEditor } from "@/components/day-schedule-editor";
import { WeatherBadge } from "@/components/weather-badge";
import { cn } from "@/lib/utils";
import type { Artist, DaySchedule, Manager } from "@/lib/types";
import {
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Link2,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react";

function formatDate(date: string): string {
  const d = new Date(date);
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`;
}

const TODAY = "2026-07-07";

export function DaySheet({
  initialSchedules,
  artists,
  managers,
}: {
  initialSchedules: DaySchedule[];
  artists: Artist[];
  managers: Manager[];
}) {
  const [schedules, setSchedules] = useState<DaySchedule[]>(initialSchedules);
  const [dateIdx, setDateIdx] = useState(0);
  const [sent, setSent] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [editorState, setEditorState] = useState<
    | { mode: "create"; date: string }
    | { mode: "edit"; schedule: DaySchedule }
    | null
  >(null);

  // 데이터에서 날짜 목록 파생 (없으면 오늘)
  const dates = useMemo(() => {
    const uniq = Array.from(new Set(schedules.map((s) => s.date))).sort();
    return uniq.length > 0 ? uniq : [TODAY];
  }, [schedules]);

  const safeIdx = Math.min(dateIdx, dates.length - 1);
  const date = dates[safeIdx];

  const copyShare = (id: string) => {
    const url = `${window.location.origin}/d/${id}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied((c) => (c === id ? null : c)), 1600);
  };

  const daySchedules = schedules.filter((s) => s.date === date);

  const broadcast = (id: string) => {
    setSent((prev) => ({ ...prev, [id]: true }));
    // DB에 전파 시각 기록 (fire-and-forget)
    fetch("/api/day-schedules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, broadcast: true }),
    }).catch(() => {});
  };

  const sendAll = () =>
    daySchedules.forEach((s) => broadcast(s.id));

  // 에디터 콜백 — 로컬 목록 갱신 + 필요 시 해당 날짜로 이동
  const handleSaved = (saved: DaySchedule) => {
    setSchedules((prev) => {
      const idx = prev.findIndex((d) => d.id === saved.id);
      if (idx >= 0) return prev.map((d) => (d.id === saved.id ? saved : d));
      return [...prev, saved];
    });
    const targetDates = Array.from(
      new Set([...schedules.map((s) => s.date), saved.date])
    ).sort();
    const newIdx = targetDates.indexOf(saved.date);
    if (newIdx >= 0) setDateIdx(newIdx);
  };

  const handleDeleted = (id: string) => {
    setSchedules((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div>
      {/* 날짜 네비 + 전체 전파 */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDateIdx((i) => Math.max(0, i - 1))}
            disabled={safeIdx === 0}
            aria-label="이전 날짜"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-900 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="min-w-36 text-center text-lg font-black">
            {formatDate(date)}
            {date === TODAY && (
              <span className="ml-1.5 align-middle text-xs font-bold text-brand-500">
                오늘
              </span>
            )}
          </h2>
          <button
            onClick={() => setDateIdx((i) => Math.min(dates.length - 1, i + 1))}
            disabled={safeIdx === dates.length - 1}
            aria-label="다음 날짜"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-900 disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditorState({ mode: "create", date })}
            className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition-colors hover:border-neutral-900"
          >
            <Plus className="h-4 w-4" /> 새 스케줄
          </button>
          {daySchedules.length > 0 && (
            <button
              onClick={sendAll}
              className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-brand-500 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <MessageCircle className="h-4 w-4" /> 전체 카톡 전파
            </button>
          )}
        </div>
      </div>

      {daySchedules.length === 0 ? (
        <Card className="flex h-48 flex-col items-center justify-center gap-2 text-neutral-400">
          <p className="font-semibold">이 날은 등록된 스케줄이 없어요</p>
          <p className="text-sm">
            확정된 섭외는 자동으로 데일리에 내려오고, 위의 &lsquo;새
            스케줄&rsquo; 버튼으로 직접 등록할 수도 있어요
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {daySchedules.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-brand-50 text-lg font-black text-neutral-300">
                    {s.artistName.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold">{s.artistName}</span>
                      <Badge>{s.eventType}</Badge>
                      <WeatherBadge
                        date={s.date}
                        location={s.stops[0]?.location}
                      />
                    </div>
                    <p className="text-sm text-neutral-500">{s.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setEditorState({ mode: "edit", schedule: s })
                    }
                    aria-label="편집"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => copyShare(s.id)}
                    className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
                  >
                    {copied === s.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-brand-500" /> 복사됨
                      </>
                    ) : (
                      <>
                        <Link2 className="h-3.5 w-3.5" /> 공유 링크
                      </>
                    )}
                  </button>
                  {sent[s.id] ? (
                    <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-neutral-100 px-3 py-2 text-xs font-semibold text-neutral-500">
                      <Check className="h-3.5 w-3.5 text-brand-500" /> 전파됨 ·
                      읽음 2/3
                    </span>
                  ) : (
                    <button
                      onClick={() => broadcast(s.id)}
                      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:border-brand-500 hover:text-brand-600"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> 카톡 전파
                    </button>
                  )}
                </div>
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

      {editorState && (
        <DayScheduleEditor
          mode={editorState.mode}
          initial={
            editorState.mode === "edit" ? editorState.schedule : undefined
          }
          defaultDate={
            editorState.mode === "create" ? editorState.date : undefined
          }
          artists={artists}
          managers={managers}
          onClose={() => setEditorState(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
