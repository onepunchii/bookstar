"use client";

import { create } from "zustand";
import type { Role } from "./role-store";

export type NotificationType =
  | "hold_expiring"
  | "new_request"
  | "quote_accepted"
  | "quote_received"
  | "message"
  | "leave_approved"
  | "leave_rejected"
  | "leave_submitted"
  | "review_received"
  | "booking_accepted"
  | "campaign_application"
  | "campaign_selected"
  | "campaign_rejected"
  | "agency_signup"
  | "feedback"
  | "ai_intake"
  | "day_broadcast";

export interface Notification {
  id: string;
  type: NotificationType;
  role: Role; // 이 알림이 어느 역할에 뜨는지
  title: string;
  body: string;
  link?: string;
  createdAt: string;
  readAt?: string;
}

interface NotificationsStore {
  items: Notification[];
  push: (n: Omit<Notification, "id" | "createdAt" | "readAt">) => void;
  markAllRead: (role: Role) => void;
  markRead: (id: string) => void;
  clear: (role: Role) => void;
}

let seq = 1000;

// 시드: 각 역할이 처음 켰을 때 활동감이 있어야 함
const SEED: Notification[] = [
  {
    id: "n1",
    type: "hold_expiring",
    role: "agency",
    title: "홀드 만료 임박",
    body: "정하늘 · 브라이트마케팅 · 7/24 홀드가 D-3 남았어요",
    link: "/agency/schedule",
    createdAt: "2026-07-07T09:12:00+09:00",
  },
  {
    id: "n2",
    type: "new_request",
    role: "agency",
    title: "새 섭외 요청",
    body: "부산문화재단 · 리센느 · 축제 · 5,000만원",
    link: "/agency/inbox",
    createdAt: "2026-07-07T08:20:00+09:00",
  },
  {
    id: "n3",
    type: "leave_submitted",
    role: "agency",
    title: "휴가 신청",
    body: "정하늘 · 7/20~7/21 · 가족 행사",
    link: "/agency/schedule",
    createdAt: "2026-07-07T07:44:00+09:00",
  },
  {
    id: "n4",
    type: "quote_accepted",
    role: "company",
    title: "견적 답변 도착",
    body: "샌드박스네트워크 · 라이브 1회 포함 총 1,800만원",
    link: "/requests/r1",
    createdAt: "2026-07-07T10:03:00+09:00",
  },
  {
    id: "n5",
    type: "leave_approved",
    role: "artist",
    title: "휴가 승인",
    body: "7/13 · 멤버 건강검진 · 승인 완료",
    link: "/me/leave",
    createdAt: "2026-07-06T18:30:00+09:00",
  },
];

export const useNotificationsStore = create<NotificationsStore>((set) => ({
  items: SEED,
  push: (n) =>
    set((s) => ({
      items: [
        {
          ...n,
          id: `n${seq++}`,
          createdAt: new Date().toISOString(),
        },
        ...s.items,
      ],
    })),
  markAllRead: (role) =>
    set((s) => ({
      items: s.items.map((n) =>
        n.role === role && !n.readAt
          ? { ...n, readAt: new Date().toISOString() }
          : n
      ),
    })),
  markRead: (id) =>
    set((s) => ({
      items: s.items.map((n) =>
        n.id === id && !n.readAt
          ? { ...n, readAt: new Date().toISOString() }
          : n
      ),
    })),
  clear: (role) =>
    set((s) => ({ items: s.items.filter((n) => n.role !== role) })),
}));

// 상대 시간 포맷 ("3시간 전")
export function formatRelative(iso: string, now: Date = new Date()): string {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, now.getTime() - then);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "방금 전";
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  return iso.slice(5, 10).replace("-", "/");
}
