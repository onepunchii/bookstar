"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import type { Artist, EventType } from "@/lib/types";
import { formatBudget } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

const EVENT_TYPES: EventType[] = [
  "행사",
  "광고",
  "유튜브",
  "예능",
  "팬미팅",
  "축제",
  "강연",
];

export function BookingForm({ artist }: { artist: Artist }) {
  const [submitted, setSubmitted] = useState(false);
  const [eventType, setEventType] = useState<EventType>("행사");

  if (submitted) {
    return (
      <Card className="mt-8 p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand-500" />
        <h2 className="mt-4 text-xl font-bold">섭외 요청을 보냈어요</h2>
        <p className="mt-2 text-sm text-neutral-500">
          {artist.agencyName} 담당자가 평균{" "}
          <span className="font-semibold text-neutral-900">
            {artist.responseHours}시간
          </span>{" "}
          내에 답변드립니다.
          <br />
          답변이 오면 이메일과 알림으로 알려드릴게요.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/requests" className={cn(buttonVariants())}>
            내 요청 확인하기
          </Link>
          <Link
            href="/artists"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            다른 아티스트 보기
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      {/* Artist summary */}
      <Card className="flex items-center gap-4 p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-brand-50 text-xl font-black text-neutral-300">
          {artist.name.slice(0, 1)}
        </div>
        <div>
          <p className="font-bold">{artist.name}</p>
          <p className="text-sm text-neutral-500">
            {artist.agencyName} · 예산대 {formatBudget(artist.budgetRange[0])}~
            {formatBudget(artist.budgetRange[1])}
          </p>
        </div>
      </Card>

      <div>
        <Label>행사 유형</Label>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEventType(t)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                eventType === t
                  ? "bg-brand-500 text-white"
                  : "border border-neutral-200 text-neutral-600 hover:border-brand-500"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="date">희망 날짜</Label>
          <Input id="date" type="date" required defaultValue="2026-07-24" />
        </div>
        <div>
          <Label htmlFor="budget">예산 (만원)</Label>
          <Input
            id="budget"
            type="number"
            required
            placeholder="예: 3000"
            min={0}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="location">지역 / 장소</Label>
          <Input id="location" required placeholder="예: 서울 코엑스" />
        </div>
        <div>
          <Label htmlFor="duration">소요 시간</Label>
          <Select id="duration" defaultValue="2-4시간">
            <option>2시간 이내</option>
            <option>2-4시간</option>
            <option>반일 (4-6시간)</option>
            <option>종일</option>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="brand">브랜드 / 주최사</Label>
        <Input id="brand" placeholder="예: (주)브라이트마케팅" />
      </div>

      <div>
        <Label htmlFor="message">상세 내용</Label>
        <Textarea
          id="message"
          rows={5}
          required
          placeholder={
            "행사 개요, 아티스트 역할(공연/진행/촬영 등), 콘텐츠 사용 범위(SNS/TVC/기간), 독점 조항 여부를 적어주시면 협의가 빨라져요."
          }
        />
      </div>

      <div className="rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">
        요청 발송은 무료입니다. 소속사가 수락하면 협의 채팅이 열리고, 견적
        확정 후에만 계약이 진행됩니다.
      </div>

      <Button type="submit" size="lg" className="w-full">
        섭외 요청 보내기
      </Button>
    </form>
  );
}
