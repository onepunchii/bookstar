"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Artist, DaySchedule, DayStop, Manager } from "@/lib/types";
import { Car, MapPin, Plus, Trash2, UserRound, X } from "lucide-react";

const EVENT_TYPES = ["방송", "예능", "광고", "축제", "행사", "유튜브", "강연"];

const EMPTY_STOP: DayStop = { time: "10:00", label: "현장 도착", location: "" };

interface Props {
  mode: "create" | "edit";
  initial?: DaySchedule;
  defaultDate?: string;
  artists: Artist[];
  managers: Manager[];
  onClose: () => void;
  onSaved: (schedule: DaySchedule) => void;
  onDeleted: (id: string) => void;
}

export function DayScheduleEditor({
  mode,
  initial,
  defaultDate,
  artists,
  managers,
  onClose,
  onSaved,
  onDeleted,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [artistId, setArtistId] = useState(
    initial?.artistId ?? artists[0]?.id ?? ""
  );
  const [date, setDate] = useState(
    initial?.date ?? defaultDate ?? "2026-07-08"
  );
  const [title, setTitle] = useState(initial?.title ?? "");
  const [eventType, setEventType] = useState(initial?.eventType ?? "행사");
  const [manager, setManager] = useState(initial?.manager ?? "");
  const [vehicle, setVehicle] = useState(initial?.vehicle ?? "");
  const [memo, setMemo] = useState(initial?.memo ?? "");
  const [stops, setStops] = useState<DayStop[]>(
    initial?.stops && initial.stops.length > 0
      ? initial.stops
      : [{ ...EMPTY_STOP }]
  );

  // ESC로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const artistName = artists.find((a) => a.id === artistId)?.name ?? "";
  const canSave = title.trim().length > 0 && stops.length > 0 && !!artistId;

  const save = async () => {
    const sorted = [...stops].sort((a, b) => a.time.localeCompare(b.time));
    const common = {
      artistId,
      date,
      title,
      eventType,
      manager,
      vehicle: vehicle || null,
      memo: memo || null,
      stops: sorted,
    };
    setSaving(true);
    setError(null);
    try {
      if (mode === "create") {
        const res = await fetch("/api/day-schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(common),
        });
        if (!res.ok) throw new Error(await res.text());
        const { id } = (await res.json()) as { id: string };
        onSaved({ id, artistName, ...common, vehicle: vehicle || undefined, memo: memo || undefined });
      } else if (initial) {
        const res = await fetch("/api/day-schedules", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: initial.id, ...common }),
        });
        if (!res.ok) throw new Error(await res.text());
        onSaved({
          id: initial.id,
          artistName,
          ...common,
          vehicle: vehicle || undefined,
          memo: memo || undefined,
        });
      }
      onClose();
    } catch {
      setError("저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const del = async () => {
    if (!initial) return;
    if (!confirm(`${initial.title} 스케줄을 삭제할까요?`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/day-schedules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: initial.id }),
      });
      if (!res.ok) throw new Error(await res.text());
      onDeleted(initial.id);
      onClose();
    } catch {
      setError("삭제에 실패했어요. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  const updateStop = (i: number, patch: Partial<DayStop>) =>
    setStops((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const removeStop = (i: number) =>
    setStops((prev) => prev.filter((_, idx) => idx !== i));
  const addStop = () =>
    setStops((prev) => [
      ...prev,
      {
        time: prev.length > 0
          ? incrementTime(prev[prev.length - 1].time, 60)
          : "10:00",
        label: "다음 스텝",
        location: "",
      },
    ]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4 border-b border-neutral-100 p-6">
          <div>
            <h2 className="text-lg font-black tracking-tight">
              {mode === "create" ? "새 데일리 스케줄" : "데일리 스케줄 편집"}
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              현장 매니저·아티스트에게 카톡으로 전파될 스케줄이에요
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 본문 */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* 아티스트·날짜 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="d-artist">아티스트</Label>
              <Select
                id="d-artist"
                value={artistId}
                onChange={(e) => setArtistId(e.target.value)}
              >
                {artists.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                    {a.groupName ? ` (${a.groupName})` : ""}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="d-date">날짜</Label>
              <Input
                id="d-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* 타이틀 */}
          <div>
            <Label htmlFor="d-title">행사명</Label>
            <Input
              id="d-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 음악방송 생방송, 브랜드 협업 촬영"
            />
          </div>

          {/* 이벤트 유형 */}
          <div>
            <Label>이벤트 유형</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEventType(t)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                    eventType === t
                      ? "bg-brand-500 text-white"
                      : "border border-neutral-200 text-neutral-600 hover:border-brand-500"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* 담당·차량 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="d-manager">
                <UserRound className="mr-1 inline h-3 w-3" /> 담당 매니저
              </Label>
              <Select
                id="d-manager"
                value={manager}
                onChange={(e) => setManager(e.target.value)}
              >
                <option value="">— 배정 안 함 —</option>
                {managers.map((m) => (
                  <option key={m.id} value={`${m.name} ${m.role}`}>
                    {m.name} {m.role} · {m.phone}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="d-vehicle">
                <Car className="mr-1 inline h-3 w-3" /> 차량 (선택)
              </Label>
              <Input
                id="d-vehicle"
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value)}
                placeholder="예: 카니발 12허 3456"
              />
            </div>
          </div>

          {/* 타임라인 스텝 */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>타임라인 스텝</Label>
              <button
                type="button"
                onClick={addStop}
                className="flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100"
              >
                <Plus className="h-3 w-3" /> 스텝 추가
              </button>
            </div>
            <div className="space-y-2">
              {stops.map((stop, i) => (
                <Card key={i} className="p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
                    <div className="sm:col-span-3">
                      <Input
                        type="time"
                        value={stop.time}
                        onChange={(e) =>
                          updateStop(i, { time: e.target.value })
                        }
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <Input
                        value={stop.label}
                        onChange={(e) =>
                          updateStop(i, { label: e.target.value })
                        }
                        placeholder="라벨 (예: 픽업, 헤메코)"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <div className="relative">
                        <MapPin className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-neutral-400" />
                        <Input
                          value={stop.location ?? ""}
                          onChange={(e) =>
                            updateStop(i, { location: e.target.value })
                          }
                          placeholder="장소 (선택)"
                          className="pl-6"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeStop(i)}
                        aria-label="스텝 삭제"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <Label htmlFor="d-memo">메모 (선택)</Label>
            <Textarea
              id="d-memo"
              rows={2}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="예: 포토타임 있음, 의상 2벌 준비, 심야 예상"
            />
          </div>
        </div>

        {/* 푸터 */}
        <div className="flex items-center justify-between gap-2 border-t border-neutral-100 bg-neutral-50 px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {mode === "edit" ? (
            <button
              onClick={del}
              className="flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-brand-600"
            >
              <Trash2 className="h-3.5 w-3.5" /> 이 스케줄 삭제
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {error && (
              <span className="text-xs font-semibold text-red-600">
                {error}
              </span>
            )}
            <Button variant="ghost" size="md" onClick={onClose}>
              취소
            </Button>
            <Button size="md" disabled={!canSave || saving} onClick={save}>
              {saving ? "저장 중…" : "저장"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function incrementTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  const nh = Math.min(23, Math.floor(total / 60));
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
}
