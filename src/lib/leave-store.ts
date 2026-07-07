"use client";

import { create } from "zustand";
import type { LeaveRequest } from "./types";

// 아티스트 모드에서 신청 → 소속사 모드에서 승인 → 캘린더 '불가' 반영.
// 두 화면이 같은 데이터를 공유한다.
interface LeaveStore {
  requests: LeaveRequest[];
  submit: (req: Omit<LeaveRequest, "id" | "status">) => void;
  decide: (id: string, status: "approved" | "rejected") => void;
}

let seq = 100;

export const useLeaveStore = create<LeaveStore>((set) => ({
  requests: [
    {
      id: "lv1",
      artistId: "a5",
      artistName: "정하늘",
      startDate: "2026-07-20",
      endDate: "2026-07-21",
      reason: "가족 행사",
      status: "pending",
    },
    {
      id: "lv2",
      artistId: "a1",
      artistName: "리센느",
      startDate: "2026-07-13",
      endDate: "2026-07-13",
      reason: "멤버 건강검진",
      status: "approved",
    },
  ],
  submit: (req) =>
    set((s) => ({
      requests: [
        { ...req, id: `lv${seq++}`, status: "pending" },
        ...s.requests,
      ],
    })),
  decide: (id, status) =>
    set((s) => ({
      requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)),
    })),
}));

// 승인된 휴가에 포함된 날짜인지 (YYYY-MM-DD 문자열 비교)
export function isOnLeave(
  requests: LeaveRequest[],
  artistId: string,
  date: string
): boolean {
  return requests.some(
    (r) =>
      r.artistId === artistId &&
      r.status === "approved" &&
      r.startDate <= date &&
      date <= r.endDate
  );
}
