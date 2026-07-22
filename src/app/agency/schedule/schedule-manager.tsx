"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { todayKST } from "@/lib/date";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WeatherBadge } from "@/components/weather-badge";
import { isOnLeave } from "@/lib/leave-store";
import { daysUntil, holdKey, type Hold } from "@/lib/schedule-store";
import {
  AVAILABILITY_LABELS,
  type Artist,
  type Availability,
  type LeaveRequest,
  type ScheduleDay,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import {
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  Link2,
  MousePointerClick,
  Palmtree,
} from "lucide-react";

const TODAY = todayKST();
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

export function ScheduleManager({
  artists,
  schedulesByArtist,
  initialHolds,
  initialLeaves,
  feedTokens = {},
}: {
  artists: Artist[];
  schedulesByArtist: Record<string, ScheduleDay[]>;
  initialHolds: Hold[];
  initialLeaves: LeaveRequest[];
  feedTokens?: Record<string, string>;
}) {
  const t = useT();
  const DOW = [
    t("agency.schedule.dowSun"),
    t("agency.schedule.dowMon"),
    t("agency.schedule.dowTue"),
    t("agency.schedule.dowWed"),
    t("agency.schedule.dowThu"),
    t("agency.schedule.dowFri"),
    t("agency.schedule.dowSat"),
  ];
  const [artistId, setArtistId] = useState(artists[0]?.id ?? "");
  const [edits, setEdits] = useState<Record<string, Availability>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedFeed, setCopiedFeed] = useState(false);
  // DB에서 받은 일정 맵 — 저장 성공 시 로컬 반영
  const [scheduleMap, setScheduleMap] =
    useState<Record<string, ScheduleDay[]>>(schedulesByArtist);

  const copyFeed = () => {
    const token = feedTokens[artistId];
    if (!token) return;
    const url = `${window.location.origin}/api/calendar/${artistId}?t=${token}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 1800);
  };

  // 드래그 다중 선택
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const dragAnchor = useRef<number | null>(null);
  const didDrag = useRef(false);

  // DB 홀드/휴가를 로컬 상태로 (쓰기는 API + 낙관적 반영)
  const [holds, setHolds] = useState<Record<string, Hold>>(() =>
    Object.fromEntries(
      initialHolds.map((h) => [holdKey(h.artistId, h.date), h])
    )
  );
  const [leaveRequests, setLeaveRequests] =
    useState<LeaveRequest[]>(initialLeaves);

  const releaseHold = (aid: string, date: string) => {
    setHolds((prev) => {
      const next = { ...prev };
      delete next[holdKey(aid, date)];
      return next;
    });
    fetch("/api/holds", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artistId: aid, date }),
    }).catch(() => {});
  };
  const decide = (id: string, status: "approved" | "rejected") => {
    setLeaveRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    fetch("/api/leaves", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
  };

  // 매니저 스코프 필터는 매니저 DB 연동 후 복원 예정.
  const visibleArtists = artists;
  const currentSlug = artists.find((a) => a.id === artistId)?.slug;

  // 스코프 변경으로 현재 아티스트가 사라졌으면 첫 번째로 스위치
  useEffect(() => {
    if (visibleArtists.length > 0 && !visibleArtists.some((a) => a.id === artistId)) {
      setArtistId(visibleArtists[0].id);
      setSelection(new Set());
    }
  }, [visibleArtists, artistId]);
  const pendingLeaves = leaveRequests.filter((r) => r.status === "pending");
  const artistHolds = useMemo(
    () =>
      Object.values(holds)
        .filter((h) => h.artistId === artistId)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [holds, artistId]
  );

  // 월 이동 — 오늘 기준월에서 시작
  const [month, setMonth] = useState(() => {
    const today = todayKST();
    return { y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) };
  });
  const monthKey = `${month.y}-${String(month.m).padStart(2, "0")}`;
  const daysInMonth = new Date(month.y, month.m, 0).getDate();
  const firstOffset = new Date(`${monthKey}-01T00:00:00`).getDay();
  const moveMonth = (delta: number) => {
    setMonth((prev) => {
      const d = new Date(prev.y, prev.m - 1 + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() + 1 };
    });
    setSelection(new Set());
  };

  const baseDays = scheduleMap[artistId] ?? [];
  const days: ScheduleDay[] = useMemo(() => {
    const byDate = new Map(baseDays.map((d) => [d.date, d]));
    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = `${monthKey}-${String(i + 1).padStart(2, "0")}`;
      const base = byDate.get(date);
      return {
        date,
        note: base?.note,
        // 우선순위: 홀드 > 승인된 휴가(불가) > 수동 편집 > 기본(미등록=협의 필요)
        availability: holds[holdKey(artistId, date)]
          ? ("hold" as Availability)
          : isOnLeave(leaveRequests, artistId, date)
            ? ("busy" as Availability)
            : (edits[`${artistId}:${date}`] ??
              base?.availability ??
              ("hold" as Availability)),
      };
    });
  }, [baseDays, edits, artistId, holds, leaveRequests, monthKey, daysInMonth]);

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
    setSaveError(null);
  };

  const handleSave = async () => {
    const changes = Object.entries(edits)
      .filter(([k]) => k.startsWith(`${artistId}:`))
      .map(([k, v]) => ({
        date: k.slice(artistId.length + 1),
        availability: v,
      }));
    if (changes.length === 0) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, slug: currentSlug, changes }),
      });
      if (!res.ok) throw new Error(await res.text());
      // 로컬 일정 맵에 반영 + 해당 아티스트 편집 클리어
      setScheduleMap((prev) => {
        const days = [...(prev[artistId] ?? [])];
        for (const c of changes) {
          const idx = days.findIndex((d) => d.date === c.date);
          if (idx >= 0)
            days[idx] = { ...days[idx], availability: c.availability };
          else days.push({ date: c.date, availability: c.availability });
        }
        days.sort((a, b) => a.date.localeCompare(b.date));
        return { ...prev, [artistId]: days };
      });
      setEdits((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next))
          if (key.startsWith(`${artistId}:`)) delete next[key];
        return next;
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setSaveError(t("agency.schedule.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        {/* 아티스트 선택 */}
        <div className="mb-4 flex flex-wrap gap-2">
          {visibleArtists.map((a) => (
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => moveMonth(-1)}
                aria-label={t("agency.schedule.prevMonth")}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-900"
              >
                ‹
              </button>
              <h2 className="min-w-28 text-center text-lg font-bold">
                {t("agency.schedule.monthLabel", { y: month.y, m: month.m })}
              </h2>
              <button
                onClick={() => moveMonth(1)}
                aria-label={t("agency.schedule.nextMonth")}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 text-neutral-500 transition-colors hover:border-neutral-900"
              >
                ›
              </button>
            </div>
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
            {Array.from({ length: firstOffset }).map((_, i) => (
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
                      ? t("agency.schedule.cellHoldTitle", {
                          d: dayNum,
                          company:
                            hold.companyName ??
                            t("agency.schedule.holdCompanyFallback"),
                          expires: hold.expiresAt,
                        })
                      : t("agency.schedule.cellTitle", {
                          d: dayNum,
                          label: AVAILABILITY_LABELS[day.availability],
                        })
                  }
                  className={cn(
                    "relative flex h-16 flex-col items-center justify-center gap-1 rounded-lg text-sm font-medium transition-colors",
                    CELL_STYLES[day.availability],
                    hold &&
                      "bg-neutral-900 text-white hover:bg-neutral-700",
                    isSelected &&
                      "ring-2 ring-neutral-900 ring-offset-1 ring-offset-white"
                  )}
                >
                  <span>{dayNum}</span>
                  <WeatherBadge
                    date={day.date}
                    compact
                    className="!bg-black/10 !text-inherit"
                  />
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
                {t("agency.schedule.daysSelected", { n: selection.size })}
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
                {t("common.cancel")}
              </button>
            </div>
          ) : (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-neutral-400">
              <MousePointerClick className="h-3.5 w-3.5" />{" "}
              {t("agency.schedule.dragHint")}
            </p>
          )}
        </Card>
      </div>

      {/* 사이드 요약 */}
      <div className="space-y-4">
        <Card className="p-6">
          <h3 className="text-sm font-bold text-neutral-500">
            {t("agency.schedule.monthSummary", { m: month.m })}
          </h3>
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
                <span className="font-bold">
                  {t("agency.schedule.dayCount", { n: counts[k] ?? 0 })}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* 휴가 신청 승인 */}
        {pendingLeaves.length > 0 && (
          <Card className="border-brand-200 p-6">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-brand-700">
              <Palmtree className="h-3.5 w-3.5" />{" "}
              {t("agency.schedule.leaveRequests", { n: pendingLeaves.length })}
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
                      {t("agency.schedule.approve")}
                    </button>
                    <button
                      onClick={() => decide(req.id, "rejected")}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-900"
                    >
                      {t("agency.schedule.reject")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-neutral-400">
              {t("agency.schedule.leaveApproveNote")}
            </p>
          </Card>
        )}

        <Card className="p-6">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
            <CalendarClock className="h-3.5 w-3.5 text-brand-500" />{" "}
            {t("agency.schedule.activeHolds")}
          </h3>
          {artistHolds.length === 0 ? (
            <p className="mt-2 text-sm text-neutral-400">
              {t("agency.schedule.noHolds")}
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
                        {t("agency.schedule.expiresDday", { n: dday })}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-neutral-500">
                      {hold.companyName ?? t("agency.schedule.requestHold")}
                    </p>
                    <button
                      onClick={() => releaseHold(hold.artistId, hold.date)}
                      className="mt-2 text-xs font-semibold text-neutral-400 transition-colors hover:text-neutral-900"
                    >
                      {t("agency.schedule.releaseHold")}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* .ics 구독 피드 */}
        <Card className="p-6">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-neutral-500">
            <CalendarDays className="h-3.5 w-3.5 text-brand-500" />{" "}
            {t("agency.schedule.calendarSubTitle")}
          </h3>
          <p className="mt-1 text-xs text-neutral-400">
            {t("agency.schedule.calendarSubDesc")}
          </p>
          <button
            onClick={copyFeed}
            className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-600 transition-colors hover:border-neutral-900 hover:text-neutral-900"
          >
            {copiedFeed ? (
              <>
                <Check className="h-3.5 w-3.5 text-brand-500" />{" "}
                {t("agency.schedule.urlCopied")}
              </>
            ) : (
              <>
                <Link2 className="h-3.5 w-3.5" />{" "}
                {t("agency.schedule.copyIcsUrl")}
              </>
            )}
          </button>
        </Card>

        <Card className="p-6">
          <h3 className="text-sm font-bold text-neutral-500">
            {t("agency.schedule.publicScopeTitle")}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            {t("agency.schedule.publicScopePrefix")}{" "}
            <span className="font-semibold">
              {t("agency.schedule.publicScopeEmph")}
            </span>{" "}
            {t("agency.schedule.publicScopeSuffix")}
          </p>
        </Card>

        {saveError && (
          <p className="text-sm font-semibold text-red-600">{saveError}</p>
        )}
        {saved ? (
          <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700">
            <CheckCircle2 className="h-4 w-4" />{" "}
            {t("agency.schedule.saveDone")}
          </div>
        ) : (
          <Button
            size="lg"
            className="w-full"
            disabled={!dirty || saving}
            onClick={handleSave}
          >
            {saving
              ? t("agency.schedule.saving")
              : t("agency.schedule.saveChanges")}
          </Button>
        )}
      </div>
    </div>
  );
}
