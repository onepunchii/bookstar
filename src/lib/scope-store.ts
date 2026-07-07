"use client";

import { create } from "zustand";
import { MANAGERS } from "./mock-data";

// 로그인한 매니저 관점 시뮬레이션 + '내 담당만 보기' 토글.
// 지금은 인증이 없으니 데모 계정으로 m1(박세진 실장)이 기본 로그인.
interface ScopeStore {
  currentManagerId: string;
  myArtistsOnly: boolean;
  setCurrentManagerId: (id: string) => void;
  toggleMyOnly: () => void;
}

export const useScopeStore = create<ScopeStore>((set) => ({
  currentManagerId: "m1",
  myArtistsOnly: false,
  setCurrentManagerId: (id) => set({ currentManagerId: id }),
  toggleMyOnly: () => set((s) => ({ myArtistsOnly: !s.myArtistsOnly })),
}));

// 현재 매니저 정보
export function getCurrentManager(id: string) {
  return MANAGERS.find((m) => m.id === id) ?? MANAGERS[0];
}

// 필터가 켜졌으면 담당 아티스트 ID Set, 꺼졌으면 null(=전체)
export function useScopedArtistIds(): Set<string> | null {
  const { currentManagerId, myArtistsOnly } = useScopeStore();
  if (!myArtistsOnly) return null;
  return new Set(getCurrentManager(currentManagerId).artistIds);
}
