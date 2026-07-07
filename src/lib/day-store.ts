"use client";

import { create } from "zustand";
import { DAY_SCHEDULES } from "./mock-data";
import type { DaySchedule, DayStop } from "./types";

// 인박스 수락 → 데일리 시트 자동 생성.
// mock DAY_SCHEDULES + 실행 중 추가된 시트를 합쳐서 노출.
interface DayStore {
  extra: DaySchedule[];
  addFromBooking: (params: {
    artistId: string;
    artistName: string;
    date: string;
    title: string;
    eventType: string;
    location?: string;
  }) => DaySchedule;
  broadcast: (id: string) => void;
  broadcasted: Set<string>;
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

export const useDayStore = create<DayStore>((set, get) => ({
  extra: [],
  broadcasted: new Set(),
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
  broadcast: (id) =>
    set((s) => {
      const next = new Set(s.broadcasted);
      next.add(id);
      return { broadcasted: next };
    }),
}));

// 한 날짜 + 스코프 필터를 적용한 데일리 시트 목록
export function selectDaySchedules(
  date: string,
  extra: DaySchedule[],
  allowedArtistIds: Set<string> | null
): DaySchedule[] {
  const all = [...DAY_SCHEDULES, ...extra];
  return all.filter(
    (s) =>
      s.date === date && (!allowedArtistIds || allowedArtistIds.has(s.artistId))
  );
}
