"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DAY_SCHEDULES } from "./mock-data";
import type { DaySchedule, DayStop } from "./types";

// 인박스 수락 → 데일리 시트 자동 생성.
// mock DAY_SCHEDULES + 실행 중 추가된 시트를 합쳐서 노출.
interface DayStore {
  extra: DaySchedule[];
  overrides: Record<string, DaySchedule>; // mock id → 수정본
  removedIds: string[]; // 삭제된 mock id 목록 (persist-friendly)
  broadcastedIds: string[]; // 전파된 스케줄 id 목록
  addFromBooking: (params: {
    artistId: string;
    artistName: string;
    date: string;
    title: string;
    eventType: string;
    location?: string;
  }) => DaySchedule;
  create: (partial: Partial<DaySchedule> & { artistId: string; date: string }) => DaySchedule;
  update: (id: string, patch: Partial<DaySchedule>) => void;
  remove: (id: string) => void;
  addStop: (id: string, stop: DayStop) => void;
  updateStop: (id: string, index: number, patch: Partial<DayStop>) => void;
  removeStop: (id: string, index: number) => void;
  broadcast: (id: string) => void;
}

// 이벤트 유형별 기본 스텝 템플릿
function stopsFor(eventType: string, location?: string): DayStop[] {
  const site = location ?? "행사장";
  switch (eventType) {
    case "방송":
    case "예능":
      return [
        { time: "06:30", label: "픽업", location: "숙소" },
        { time: "07:30", label: "헤메코", location: "청담 살롱" },
        { time: "10:00", label: "방송국 도착", location: site },
        { time: "13:00", label: "리허설" },
        { time: "17:00", label: "본방송" },
        { time: "19:00", label: "종료 · 복귀" },
      ];
    case "광고":
      return [
        { time: "08:00", label: "픽업", location: "숙소" },
        { time: "09:30", label: "스튜디오 도착", location: site },
        { time: "10:00", label: "촬영" },
        { time: "18:00", label: "종료" },
      ];
    case "축제":
      return [
        { time: "13:00", label: "픽업", location: "연습실" },
        { time: "15:00", label: "현장 도착", location: site },
        { time: "16:00", label: "사운드체크" },
        { time: "19:00", label: "본무대" },
        { time: "20:00", label: "종료" },
      ];
    case "유튜브":
      return [
        { time: "09:00", label: "픽업", location: "자택" },
        { time: "10:00", label: "촬영지 도착", location: site },
        { time: "10:30", label: "촬영 시작" },
        { time: "15:00", label: "종료 · 복귀" },
      ];
    case "행사":
    default:
      return [
        { time: "08:00", label: "현장 도착", location: site },
        { time: "09:00", label: "큐시트 리뷰" },
        { time: "10:00", label: "행사 진행" },
        { time: "17:00", label: "종료" },
      ];
  }
}

let seq = 500;

import { ARTISTS } from "./mock-data";

function mergePatch(base: DaySchedule, patch: Partial<DaySchedule>): DaySchedule {
  return { ...base, ...patch };
}

export const useDayStore = create<DayStore>()(
  persist(
    (set) => ({
      extra: [],
      overrides: {},
      removedIds: [],
      broadcastedIds: [],
  addFromBooking: (params) => {
    const created: DaySchedule = {
      id: `d${seq++}`,
      artistId: params.artistId,
      artistName: params.artistName,
      date: params.date,
      title: params.title,
      eventType: params.eventType,
      manager: "자동 배정 대기",
      stops: stopsFor(params.eventType, params.location),
      memo: "인박스 수락 · 자동 생성됨. 담당 매니저·차량을 배정해주세요.",
    };
    set((s) => ({ extra: [...s.extra, created] }));
    return created;
  },
  create: (partial) => {
    const artist = ARTISTS.find((a) => a.id === partial.artistId);
    const created: DaySchedule = {
      id: `d${seq++}`,
      artistId: partial.artistId,
      artistName: partial.artistName ?? artist?.name ?? "미배정",
      date: partial.date,
      title: partial.title ?? "새 일정",
      eventType: partial.eventType ?? "행사",
      manager: partial.manager ?? "미배정",
      vehicle: partial.vehicle,
      stops: partial.stops && partial.stops.length > 0 ? partial.stops : [
        { time: "10:00", label: "현장 도착" },
      ],
      memo: partial.memo,
    };
    set((s) => ({ extra: [...s.extra, created] }));
    return created;
  },
  update: (id, patch) =>
    set((s) => {
      // extra에 있는지 확인
      const inExtra = s.extra.find((d) => d.id === id);
      if (inExtra) {
        return {
          extra: s.extra.map((d) => (d.id === id ? mergePatch(d, patch) : d)),
        };
      }
      // mock DAY_SCHEDULES에 있으면 overrides에 저장
      const base = s.overrides[id] ?? DAY_SCHEDULES.find((d) => d.id === id);
      if (!base) return s;
      return {
        overrides: { ...s.overrides, [id]: mergePatch(base, patch) },
      };
    }),
  remove: (id) =>
    set((s) => {
      if (s.extra.find((d) => d.id === id)) {
        return { extra: s.extra.filter((d) => d.id !== id) };
      }
      if (s.removedIds.includes(id)) return s;
      return { removedIds: [...s.removedIds, id] };
    }),
  addStop: (id, stop) =>
    set((s) => {
      const cur =
        s.extra.find((d) => d.id === id) ??
        s.overrides[id] ??
        DAY_SCHEDULES.find((d) => d.id === id);
      if (!cur) return s;
      const nextStops = [...cur.stops, stop].sort((a, b) =>
        a.time.localeCompare(b.time)
      );
      return applyUpdate(s, id, { stops: nextStops });
    }),
  updateStop: (id, index, patch) =>
    set((s) => {
      const cur =
        s.extra.find((d) => d.id === id) ??
        s.overrides[id] ??
        DAY_SCHEDULES.find((d) => d.id === id);
      if (!cur) return s;
      const nextStops = cur.stops.map((stop, i) =>
        i === index ? { ...stop, ...patch } : stop
      );
      return applyUpdate(s, id, { stops: nextStops });
    }),
  removeStop: (id, index) =>
    set((s) => {
      const cur =
        s.extra.find((d) => d.id === id) ??
        s.overrides[id] ??
        DAY_SCHEDULES.find((d) => d.id === id);
      if (!cur) return s;
      return applyUpdate(s, id, {
        stops: cur.stops.filter((_, i) => i !== index),
      });
    }),
  broadcast: (id) =>
    set((s) => {
      if (s.broadcastedIds.includes(id)) return s;
      return { broadcastedIds: [...s.broadcastedIds, id] };
    }),
    }),
    { name: "xong-day-schedules" }
  )
);

// 상태 업데이트 헬퍼
function applyUpdate(
  s: DayStore,
  id: string,
  patch: Partial<DaySchedule>
): Partial<DayStore> {
  const inExtra = s.extra.find((d) => d.id === id);
  if (inExtra) {
    return {
      extra: s.extra.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    };
  }
  const base = s.overrides[id] ?? DAY_SCHEDULES.find((d) => d.id === id);
  if (!base) return {};
  return {
    overrides: { ...s.overrides, [id]: { ...base, ...patch } },
  };
}

// 한 날짜 + 스코프 필터를 적용한 데일리 시트 목록
export function selectDaySchedules(
  date: string,
  extra: DaySchedule[],
  allowedArtistIds: Set<string> | null,
  overrides: Record<string, DaySchedule> = {},
  removedIds: string[] = []
): DaySchedule[] {
  const removedSet = new Set(removedIds);
  const mocks = DAY_SCHEDULES.filter((d) => !removedSet.has(d.id)).map(
    (d) => overrides[d.id] ?? d
  );
  const all = [...mocks, ...extra];
  return all.filter(
    (s) =>
      s.date === date && (!allowedArtistIds || allowedArtistIds.has(s.artistId))
  );
}
