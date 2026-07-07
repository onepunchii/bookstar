"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BOOKING_REQUESTS } from "./mock-data";
import type { BookingRequest, BookingStatus, ThreadMessage } from "./types";

interface BookingsStore {
  extra: BookingRequest[];
  overrides: Record<string, Partial<BookingRequest>>;
  threads: Record<string, ThreadMessage[]>; // requestId -> messages (신규만)
  add: (r: Omit<BookingRequest, "id" | "createdAt" | "unreadCount">) => BookingRequest;
  updateStatus: (id: string, status: BookingStatus) => void;
  appendMessage: (
    requestId: string,
    msg: Omit<ThreadMessage, "id" | "requestId" | "createdAt">
  ) => void;
}

let seq = 800;
let msgSeq = 900;

export const useBookingsStore = create<BookingsStore>()(
  persist(
    (set) => ({
      extra: [],
      overrides: {},
      threads: {},
  add: (r) => {
    const created: BookingRequest = {
      ...r,
      id: `r${seq++}`,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ extra: [created, ...s.extra] }));
    return created;
  },
  updateStatus: (id, status) =>
    set((s) => {
      const inExtra = s.extra.find((r) => r.id === id);
      if (inExtra) {
        return {
          extra: s.extra.map((r) => (r.id === id ? { ...r, status } : r)),
        };
      }
      return {
        overrides: {
          ...s.overrides,
          [id]: { ...(s.overrides[id] ?? {}), status },
        },
      };
    }),
  appendMessage: (requestId, msg) =>
    set((s) => {
      const created: ThreadMessage = {
        ...msg,
        id: `m${msgSeq++}`,
        requestId,
        createdAt: new Date().toISOString(),
      };
      return {
        threads: {
          ...s.threads,
          [requestId]: [...(s.threads[requestId] ?? []), created],
        },
      };
    }),
    }),
    { name: "xong-bookings" }
  )
);

export function allRequests(
  extra: BookingRequest[],
  overrides: Record<string, Partial<BookingRequest>>
): BookingRequest[] {
  const mocks = BOOKING_REQUESTS.map((r) => ({ ...r, ...(overrides[r.id] ?? {}) }));
  return [...extra, ...mocks];
}
