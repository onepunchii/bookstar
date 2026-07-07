"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = "company" | "agency" | "artist";

interface RoleState {
  role: Role;
  setRole: (role: Role) => void;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set) => ({
      role: "company",
      setRole: (role) => set({ role }),
    }),
    {
      name: "bookstar-role",
      // SSR과 첫 클라이언트 렌더를 일치시키기 위해 수동 rehydrate
      skipHydration: true,
    }
  )
);
