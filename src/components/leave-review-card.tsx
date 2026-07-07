"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useNotificationsStore } from "@/lib/notifications-store";
import { useReviewsStore } from "@/lib/reviews-store";
import { CheckCircle2, Star } from "lucide-react";
import { RatingStars } from "./rating-stars";

interface Props {
  artistId: string;
  artistName: string;
  companyName: string;
  eventTitle: string;
}

export function LeaveReviewCard({
  artistId,
  artistName,
  companyName,
  eventTitle,
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
      <Card className="border-brand-200 bg-brand-50/40 p-5">
        <div className="flex items-center gap-2 text-brand-700">
          <CheckCircle2 className="h-4 w-4" />
          <p className="text-sm font-bold">리뷰 등록 완료</p>
        </div>
        <p className="mt-1 text-xs text-neutral-500">
          공개 프로필에 즉시 반영되고, 소속사에게도 알림이 갔어요.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center gap-1.5">
        <Star className="h-4 w-4 text-brand-500" />
        <h3 className="text-sm font-bold">이번 섭외는 어떠셨나요?</h3>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        {artistName} · {eventTitle}
      </p>
      <div className="mt-4">
        <RatingStars
          value={rating}
          size="lg"
          interactive
          onChange={setRating}
        />
      </div>
      <Textarea
        className="mt-3"
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
    </Card>
  );
}
