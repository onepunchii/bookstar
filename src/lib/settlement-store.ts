"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SETTLEMENTS, getArtist } from "./mock-data";
import type { Settlement } from "./types";

interface SettlementStore {
  extra: Settlement[];
  overrides: Record<string, Partial<Settlement>>;
  add: (partial: Omit<Settlement, "id">) => Settlement;
  update: (id: string, patch: Partial<Settlement>) => void;
  markInvoice: (id: string) => void;
}

let seq = 700;

export const useSettlementStore = create<SettlementStore>()(
  persist(
    (set) => ({
      extra: [],
      overrides: {},
  add: (partial) => {
    const artist = getArtist(partial.artistId);
    const created: Settlement = {
      id: `s${seq++}`,
      artistName: partial.artistName ?? artist?.name ?? "",
      artistId: partial.artistId,
      eventTitle: partial.eventTitle,
      date: partial.date,
      gross: partial.gross,
      agencyRate:
        partial.agencyRate ?? artist?.defaultAgencyRate ?? 0.3,
      status: partial.status ?? "pending",
      taxInvoice: partial.taxInvoice ?? false,
    };
    set((s) => ({ extra: [created, ...s.extra] }));
    return created;
  },
  update: (id, patch) =>
    set((s) => {
      const inExtra = s.extra.find((x) => x.id === id);
      if (inExtra) {
        return {
          extra: s.extra.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        };
      }
      return {
        overrides: {
          ...s.overrides,
          [id]: { ...(s.overrides[id] ?? {}), ...patch },
        },
      };
    }),
  markInvoice: (id) =>
    set((s) => {
      const inExtra = s.extra.find((x) => x.id === id);
      if (inExtra) {
        return {
          extra: s.extra.map((x) =>
            x.id === id ? { ...x, taxInvoice: true } : x
          ),
        };
      }
      return {
        overrides: {
          ...s.overrides,
          [id]: { ...(s.overrides[id] ?? {}), taxInvoice: true },
        },
      };
    }),
    }),
    { name: "xong-settlements" }
  )
);

// mock + 신규 + overrides 병합
export function allSettlements(
  extra: Settlement[],
  overrides: Record<string, Partial<Settlement>>
): Settlement[] {
  const mocks = SETTLEMENTS.map((s) => ({ ...s, ...(overrides[s.id] ?? {}) }));
  return [...extra, ...mocks];
}
