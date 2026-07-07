"use client";

import { create } from "zustand";

// 홀드(가일정): 요청 수락 시 자동 생성되고, 만료일까지 확정 못 하면 풀린다.
// 인박스와 일정 관리가 같은 데이터를 공유한다.
export interface Hold {
  artistId: string;
  date: string; // YYYY-MM-DD
  requestId?: string;
  companyName?: string;
  expiresAt: string; // YYYY-MM-DD
}

const keyOf = (artistId: string, date: string) => `${artistId}:${date}`;

interface ScheduleStore {
  holds: Record<string, Hold>;
  placeHold: (hold: Hold) => void;
  releaseHold: (artistId: string, date: string) => void;
}

export const useScheduleStore = create<ScheduleStore>((set) => ({
  // 데모 시드: 정하늘 7/24 — 협의 중인 r1 요청의 홀드
  holds: {
    "a5:2026-07-24": {
      artistId: "a5",
      date: "2026-07-24",
      requestId: "r1",
      companyName: "(주)브라이트마케팅",
      expiresAt: "2026-07-10",
    },
  },
  placeHold: (hold) =>
    set((s) => ({
      holds: { ...s.holds, [keyOf(hold.artistId, hold.date)]: hold },
    })),
  releaseHold: (artistId, date) =>
    set((s) => {
      const next = { ...s.holds };
      delete next[keyOf(artistId, date)];
      return { holds: next };
    }),
}));

export function holdKey(artistId: string, date: string) {
  return keyOf(artistId, date);
}

export function daysUntil(from: string, to: string): number {
  return Math.round(
    (new Date(to).getTime() - new Date(from).getTime()) / 86400000
  );
}
