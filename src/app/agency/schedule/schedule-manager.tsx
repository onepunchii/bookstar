"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ARTISTS, SCHEDULES } from "@/lib/mock-data";
import { isOnLeave, useLeaveStore } from "@/lib/leave-store";
import { daysUntil, holdKey, useScheduleStore } from "@/lib/schedule-store";
import {
  AVAILABILITY_LABELS,
  type Availability,
  type ScheduleDay,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  CalendarClock,
  CheckCircle2,
  MousePointerClick,
  Palmtree,
} from "lucide-react";

const TODAY = "2026-07-07";
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const CYCLE: Availability[] = ["available", "partial", "hold", "busy"];

const CELL_STYLES: Record<Availability, string> = {
  available: "bg-brand-500 text-white hover:bg-brand-600",
  partial: "bg-brand-100 text-brand-700 hover:bg-brand-200",
  hold: "bg-neutral-200 text-neutral-500 hover:bg-neutral-300",
  busy: "bg-neutral-50 text-neutral-300 hover:bg-neutral-100",
};

const DOT_STYLES: Record<Availability, string> = {
  available: "bg-brand-500",
  partial: "bg-brand-100",
  hold: "bg-neutral-200",
  busy: "bg-neutral-50 border border-neutral-200",
};

export function ScheduleManager() {
  const [artistId, setArtistId] = useState(ARTISTS[0].id);
  const [edits, setEdits] = useState<Record<string, Availability>>({});
  const [saved, setSaved] = useState(false);

  // 드래그 다중 선택
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const dragAnchor = useRef<number | null>(null);
  const didDrag = useRef(false);

  const { holds, releaseHold } = useScheduleStore();
  const { requests: leaveRequests, decide } = useLeaveStore();
  const pendingLeaves = leaveRequests.filter((r) => r.status === "pending");
  const artistHolds = useMemo(
    () =>
      Object.values(holds)
        .filter((h) => h.artistId === artistId)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [holds, artistId]
  );

  const baseDays = SCHEDULES[artistId] ?? [];
  const days: ScheduleDay[] = useMemo(
    () =>
      baseDays.map((d) => ({
        ...d,
        // 우선순위: 홀드 > 승인된 휴가(불가) > 수동 편집 > 기본
        availability: holds[holdKey(artistId, d.date)]
          ? "hold"
          : isOnLeave(leaveRequests, artistId, d.date)
            ? "busy"
            : (edits[`${artistId}:${d.date}`] ?? d.availability),
      })),
    [baseDays, edits, artistId, holds, leaveRequests]
  );

  const applyTo = (dates: string[], value: Availability) => {
    setEdits((prev) => {
      const next = { ...prev };
      for (const date of dates) next[`${artistId}:${date}`] = value;
      return next;
    });
    setSaved(false);
  };

  const cycleDay = (date: string, current: Availability) => {
    applyTo([date], CYCLE[(CYCLE.indexOf(current) + 1) % CYCLE.length]);
  };

  const startDrag = (index: number) => {
    dragAnchor.current = index;
    didDrag.current = false;
    setSelection(new Set());
  };

  const extendDrag = (index: number) => {
    if (dragAnchor.current === null) return;
    didDrag.current = true;
    const [from, to] = [
      Math.min(dragAnchor.current, index),
      Math.max(dragAnchor.current, index),
    ];
    setSelection(new Set(days.slice(from, to + 1).map((d) => d.date)));
  };

  useEffect(() => {
    const onUp = () => {
      if (dragAnchor.current === null) return;
      if (!didDrag.current) {
        const day = days[dragAnchor.current];
        // 홀드된 날은 클릭 순환 대신 홀드 해제로만 변경 가능
        if (!holds[holdKey(artistId, day.date)]) {
          cycleDay(day.date, day.availability);
        }
        setSelection(new Set());
      }
      dragAnchor.current = null;
    };
    window.addEventListener("mouseup", onUp);
    return () => window.removeEventListener("mouseup", onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days, artistId]);

  const counts = days.reduce(
    (acc, d) => ({ ...acc, [d.availability]: (acc[d.availability] ?? 0) + 1 }),
    {} as Record<Availability, number>
  );
  const dirty = Object.keys(edits).some((k) => k.startsWith(`${artistId}:`));

  const selectArtist = (id: string) => {
    setArtistId(id);
    setSelection(new Set());
    setSaved(false);
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {/* 아티스트 선택 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {ARTISTS.map((a) => (
            <button
              key={a.id}
              onClick={() => selectArtist(a.id)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                artistId === a.id
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 text-neutral-600 hover:border-neutral-900"
              )}
            >
              {a.name}
            </button>
          ))}
        </div>

        <Card className="p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">2026년 7월</h2>
            <div className="flex gap-3 text-xs text-neutral-500">
              {CYCLE.map((k) => (
                <span key={k} className="flex items-center gap-1">
                  <span className={cn("h-2.5 w-2.5 rounded", DOT_STYLES[k])} />
                  {AVAILABILITY_LABELS[k]}
                </span>
              ))}
            </div>
          </div>

          <div className="grid select-none grid-cols-7 gap-1.5">
            {DOW.map((d) => (
              <div
                key={d}
                className="pb-1 text-center text-xs font-medium text-neutral-400"
              >
                {d}
              </div>
            ))}
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day, i) => {
              const dayNum = Number(day.date.slice(-2));
              const isSelected = selection.has(day.date);
              const hold = holds[holdKey(artistId, day.date)];
              return (
                <button
                  key={day.date}
                  onMouseDown={() => startDrag(i)}
                  onMouseEnter={() => extendDrag(i)}
                  title={
                    hold
                      ? `${dayNum}일 · 홀드 — ${hold.companyName ?? "요청"} (${hold.expiresAt} 만료)`
                      : `${dayNum}일 · ${AVAILABILITY_LABELS[day.availability]}`
                  }
                  className={cn(
                    "relative flex h-12 items-center justify-center rounded-lg text-sm font-medium transition-colors",
                    CELL_STYLES[day.availability],
                    hold &&
                      "bg-neutral-900 text-white hover:bg-neutral-700",
                    isSelected &&
                      "ring-2 ring-neutral-900 ring-offset-1 ring-offset-white"
                  )}
                >
                  {dayNum}
                  {hold && (
                    <CalendarClock className="absolute right-1 top-1 h-3 w-3 text-brand-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 다중 선택 액션 바 */}
          {selection.size > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-neutral-900 bg-neutral-950 px-4 py-3">
              <span className="mr-1 text-sm font-bold text-white">
                {selection.size}일 선택
              </span>
              {CYCLE.map((k) => (
                <button
                  key={k}
                  onClick={() => {
                    applyTo([...selection], k);
                    setSelection(new Set());
                  }}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    k === "available"
                      ? "bg-brand-500 text-white hover:bg-brand-600"
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                >
                  {AVAILABILITY_LABELS[k]}
                </button>
              ))}
              <button
                onClick={() => setSelection(new Set())}
                className="ml-auto text-xs font-semibold text-neutral-400 hover:text-white"
              >
                취소
              </button>
            </div>
          ) : (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-neutral-400">
              <MousePointerClick className="h-3.5 w-3.5" /> 클릭하면 상태가
              순환하고, 드래그하면 여러 날을 한 번에 바꿀 수 있어요
            </p>
          )}
        </Card>
      </div>

      {/* 사이드 요약 */}
      <div className="space-y-4">
        <Card className="p-6">
          <h3 className="text-sm font-bold text-neutral-500">7월 요약</h3>
          <div className="mt-3 space-y-2.5">
            {CYCLE.map((k) => (
              <div
                key={k}
                className="flex items-center justify-between text-sm"
              >
                <span className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded", DOT_STYLES[k])} />
                  {AVAILABILITY_LABELS[k]}
                </span>
                <span className="font-bold">{counts[k] ?? 0}일</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 휴가 신청 승인 */}
        {pendingLeaves.length > 0 && (
          <Card className="border-brand-200 p-6">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-brand-700">
              <Palmtree className="h-3.5 w-3.5" /> 휴가 신청{" "}
              {pendingLeaves.length}건
            </h3>
            <div className="mt-3 space-y-3">
              {pendingLeaves.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3"
                >
                  <p className="text-sm font-bold">{req.artistName}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">
                    {req.startDate}
                    {req.endDate !== req.startDate && ` ~ ${req.endDate}`} ·{" "}
                    {req.reason}
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => decide(req.id, "approved")}
                      className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-neutral-700"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => decide(req.id, "rejected")}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-900"
                    >
                      거절
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              승인하면 해당 날짜가 자동으로 &lsquo;불가&rsquo; 처리돼요
            </p>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
            <CalendarClock className="h-3.5 w-3.5 text-brand-500" /> 활성 홀드
          </h3>
          {artistHolds.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-400">
              활성 홀드가 없어요. 인박스에서 요청을 수락하면 자동으로
              생성됩니다.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {artistHolds.map((hold) => {
                const dday = daysUntil(TODAY, hold.expiresAt);
                return (
                  <div
                    key={hold.date}
                    className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">{hold.date}</span>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold",
                          dday <= 3
                            ? "bg-brand-500 text-white"
                            : "bg-neutral-200 text-neutral-600"
                        )}
                      >
                        만료 D-{dday}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">
                      {hold.companyName ?? "요청 홀드"}
                    </p>
                    <button
                      onClick={() => releaseHold(hold.artistId, hold.date)}
                      className="mt-2 text-xs font-semibold text-neutral-400 transition-colors hover:text-neutral-900"
                    >
                      홀드 해제
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold text-neutral-500">공개 범위</h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            광고주에게는 <span className="font-semibold">가능 여부만</span>{" "}
            공개됩니다. 장소·세부 일정·촬영 내용은 절대 노출되지 않아요.
          </p>
        </Card>

        {saved ? (
          <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
            <CheckCircle2 className="h-4 w-4" /> 저장 완료
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={!dirty}
            onClick={() => setSaved(true)}
          >
            변경사항 저장
          </Button>
        )}
      </div>
    </div>
  );
}
