"use client";

// 로그인/역할선택 모달 전역 상태 (Provider 불필요).
import { create } from "zustand";

interface AuthUiState {
  isLoggedIn: boolean;
  setLoggedIn: (v: boolean) => void;
  loginOpen: boolean;
  loginReason: string | null; // 게이트 사유(예: "섭외 요청을 보내려면")
  openLogin: (reason?: string) => void;
  closeLogin: () => void;
  roleOpen: boolean;
  openRole: () => void;
  closeRole: () => void;
}

export const useAuthUi = create<AuthUiState>((set) => ({
  isLoggedIn: false,
  setLoggedIn: (v) => set({ isLoggedIn: v }),
  loginOpen: false,
  loginReason: null,
  openLogin: (reason) => set({ loginOpen: true, loginReason: reason ?? null }),
  closeLogin: () => set({ loginOpen: false, loginReason: null }),
  roleOpen: false,
  openRole: () => set({ roleOpen: true }),
  closeRole: () => set({ roleOpen: false }),
}));
