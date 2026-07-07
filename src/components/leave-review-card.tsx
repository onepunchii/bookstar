"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useNotificationsStore } from "@/lib/notifications-store";
import { useReviewsStore } from "@/lib/reviews-store";
import { cn } from "@/lib/utils";
import { CheckCircle2, Star } from "lucide-react";
import { RatingStars } from "./rating-stars";

interface Props {
  artistId: string;
  artistName: string;
  companyName: string;
  eventTitle: string;
  dark?: boolean;
}

export function LeaveReviewCard({
  artistId,
  artistName,
  companyName,
  eventTitle,
  dark = false,
}: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const addReview = useReviewsStore((s) => s.add);
  const pushNotif = useNotificationsStore((s) => s.push);

  const submit = () => {
    if (rating === 0 || !comment.trim()) return;
    addReview({ artistId, companyName, eventTitle, rating, comment });
    pushNotif({
      type: "review_received",
      role: "agency",
      title: "새 리뷰 도착",
      body: `${companyName} · ${rating}점 · ${artistName}`,
      link: `/artists/${artistId}`,
    });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className={cn(
          "rounded-2xl p-5",
          dark
            ? "adv-card ring-1 ring-brand-500/30"
            : "border border-brand-200 bg-brand-50/40"
        )}
      >
        <div
          className={cn(
            "flex items-center gap-2",
            dark ? "text-brand-300" : "text-brand-700"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          <p className="text-sm font-bold">리뷰 등록 완료</p>
        </div>
        <p className={cn("mt-1 text-xs", dark ? "text-white/50" : "text-neutral-500")}>
          공개 프로필에 즉시 반영되고, 소속사에게도 알림이 갔어요.
        </p>
      </div>
    );
  }

  const inner = (
    <>
      <div className="flex items-center gap-1.5">
        <Star className="h-4 w-4 text-brand-500" />
        <h3 className={cn("text-sm font-bold", dark && "text-white")}>
          이번 섭외는 어떠셨나요?
        </h3>
      </div>
      <p className={cn("mt-1 text-xs", dark ? "text-white/50" : "text-neutral-500")}>
        {artistName} · {eventTitle}
      </p>
      <div className="mt-4">
        <RatingStars value={rating} size="lg" interactive onChange={setRating} />
      </div>
      <textarea
        className={cn(
          "mt-3 w-full rounded-lg px-3 py-2 text-sm outline-none",
          dark
            ? "bg-white/[0.06] text-white placeholder:text-white/35 focus:bg-white/[0.09]"
            : "border border-neutral-300 placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        )}
        rows={3}
        placeholder="현장 매너, 커뮤니케이션, 결과물 만족도 등을 남겨주세요"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      <Button
        onClick={submit}
        disabled={rating === 0 || !comment.trim()}
        className="mt-3"
      >
        리뷰 남기기
      </Button>
    </>
  );

  return dark ? (
    <div className="adv-card rounded-2xl p-5">{inner}</div>
  ) : (
    <Card className="p-5">{inner}</Card>
  );
}
