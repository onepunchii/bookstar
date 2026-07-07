"use client";

import { create } from "zustand";
import { REVIEWS } from "./mock-data";
import type { Review } from "./types";

interface ReviewsStore {
  extra: Review[];
  add: (r: Omit<Review, "id" | "createdAt">) => Review;
}

let seq = 900;

export const useReviewsStore = create<ReviewsStore>((set) => ({
  extra: [],
  add: (r) => {
    const created: Review = {
      ...r,
      id: `rv${seq++}`,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ extra: [created, ...s.extra] }));
    return created;
  },
}));

export function allReviewsFor(artistId: string, extra: Review[]) {
  return [
    ...extra.filter((r) => r.artistId === artistId),
    ...REVIEWS.filter((r) => r.artistId === artistId),
  ];
}
