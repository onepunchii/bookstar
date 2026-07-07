"use client";

import { Card } from "@/components/ui/card";
import { getRatingSummary } from "@/lib/mock-data";
import { allReviewsFor, useReviewsStore } from "@/lib/reviews-store";
import { cn } from "@/lib/utils";
import { RatingStars } from "./rating-stars";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export function ReviewsSection({
  artistId,
  dark = false,
}: {
  artistId: string;
  dark?: boolean;
}) {
  const extra = useReviewsStore((s) => s.extra);
  const reviews = allReviewsFor(artistId, extra);
  // 유저가 남긴 리뷰가 더 있으면 avg 재계산
  const combined = reviews;
  const avg =
    combined.length === 0
      ? 0
      : Math.round(
          (combined.reduce((sum, r) => sum + r.rating, 0) / combined.length) *
            10
        ) / 10;
  const seedSummary = getRatingSummary(artistId);
  const count = extra.filter((r) => r.artistId === artistId).length +
    seedSummary.count;

  if (reviews.length === 0) {
    return (
      <section>
        <h2 className={cn("text-lg font-bold", dark && "text-white")}>리뷰</h2>
        <p className={cn("mt-2 text-sm", dark ? "text-white/40" : "text-neutral-400")}>
          아직 등록된 리뷰가 없어요. 첫 섭외 후 광고주가 남기는 리뷰가 여기에
          쌓여요.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className={cn("text-lg font-bold", dark && "text-white")}>리뷰</h2>
        <div className="flex items-center gap-2">
          <RatingStars value={avg} size="sm" />
          <span className={cn("text-sm font-bold", dark && "text-white")}>
            {avg.toFixed(1)}
          </span>
          <span className={cn("text-xs", dark ? "text-white/40" : "text-neutral-400")}>
            ({count}건)
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-3">
        {reviews.map((r) =>
          dark ? (
            <div key={r.id} className="adv-card rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <RatingStars value={r.rating} size="sm" />
                <span className="text-sm font-bold text-white">
                  {r.companyName}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-white/40">
                {r.eventTitle} · {formatDate(r.createdAt)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/75">
                {r.comment}
              </p>
            </div>
          ) : (
            <Card key={r.id} className="p-5">
              <div className="flex items-center gap-2">
                <RatingStars value={r.rating} size="sm" />
                <span className="text-sm font-bold">{r.companyName}</span>
              </div>
              <p className="mt-0.5 text-xs text-neutral-400">
                {r.eventTitle} · {formatDate(r.createdAt)}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">
                {r.comment}
              </p>
            </Card>
          )
        )}
      </div>
    </section>
  );
}
