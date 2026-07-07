"use client";

import { useState } from "react";
import Link from "next/link";
import { useBookingsStore } from "@/lib/bookings-store";
import { useNotificationsStore } from "@/lib/notifications-store";
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

const LABEL = "mb-1.5 block text-sm font-medium text-white/70";
const FIELD =
  "adv-glass h-11 w-full rounded-xl px-3.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-500/50";

export function BookingForm({ artist }: { artist: Artist }) {
  const [submitted, setSubmitted] = useState(false);
  const [eventType, setEventType] = useState<EventType>("행사");
  const addBooking = useBookingsStore((s) => s.add);
  const pushNotif = useNotificationsStore((s) => s.push);

  if (submitted) {
    return (
      <div className="adv-card mt-8 rounded-[1.75rem] p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand-500" />
        <h2 className="mt-4 text-xl font-bold text-white">
          섭외 요청을 보냈어요
        </h2>
        <p className="mt-2 text-sm text-white/55">
          {artist.agencyName} 담당자가 평균{" "}
          <span className="font-semibold text-white">
            {artist.responseHours}시간
          </span>{" "}
          내에 답변드립니다.
          <br />
          답변이 오면 이메일과 알림으로 알려드릴게요.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/requests"
            className="premium-ease inline-flex h-11 items-center rounded-xl bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-600"
          >
            내 요청 확인하기
          </Link>
          <Link
            href="/artists"
            className="premium-ease inline-flex h-11 items-center rounded-xl bg-white/5 px-5 text-sm font-bold text-white/80 ring-1 ring-white/10 hover:text-white"
          >
            다른 아티스트 보기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      className="mt-8 space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const created = addBooking({
          artistId: artist.id,
          artistName: artist.name,
          companyName: "(주)브라이트마케팅",
          companyVerified: true,
          companyEventCount: 12,
          eventType,
          budget: Number(form.get("budget") ?? 0),
          location: String(form.get("location") ?? ""),
          date: String(form.get("date") ?? "2026-07-24"),
          message: String(form.get("message") ?? ""),
          status: "pending",
        });
        pushNotif({
          type: "new_request",
          role: "agency",
          title: "새 섭외 요청",
          body: `${artist.name} · ${eventType} · 예산 ${form.get("budget") ?? 0}만원`,
          link: "/agency/inbox",
        });
        pushNotif({
          type: "new_request",
          role: "company",
          title: "섭외 요청 접수 완료",
          body: `${artist.name} · 소속사 응답 대기 중`,
          link: `/requests/${created.id}`,
        });
        setSubmitted(true);
      }}
    >
      {/* Artist summary */}
      <div className="adv-card flex items-center gap-4 rounded-2xl p-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.06] text-xl font-black text-white/40">
          {artist.name.slice(0, 1)}
        </div>
        <div>
          <p className="font-bold text-white">{artist.name}</p>
          <p className="text-sm text-white/50">
            {artist.agencyName} · 예산대 {formatBudget(artist.budgetRange[0])}~
            {formatBudget(artist.budgetRange[1])}
          </p>
        </div>
      </div>

      <div>
        <p className={LABEL}>행사 유형</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEventType(t)}
              className={cn(
                "premium-ease rounded-full px-4 py-2 text-sm font-medium",
                eventType === t
                  ? "bg-brand-500 text-white"
                  : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:text-white"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className={LABEL}>
            희망 날짜
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue="2026-07-24"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="budget" className={LABEL}>
            예산 (만원)
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            required
            placeholder="예: 3000"
            min={0}
            className={FIELD}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="location" className={LABEL}>
            지역 / 장소
          </label>
          <input
            id="location"
            name="location"
            required
            placeholder="예: 서울 코엑스"
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="duration" className={LABEL}>
            소요 시간
          </label>
          <select id="duration" defaultValue="2-4시간" className={FIELD}>
            <option className="bg-neutral-900">2시간 이내</option>
            <option className="bg-neutral-900">2-4시간</option>
            <option className="bg-neutral-900">반일 (4-6시간)</option>
            <option className="bg-neutral-900">종일</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="brand" className={LABEL}>
          브랜드 / 주최사
        </label>
        <input
          id="brand"
          placeholder="예: (주)브라이트마케팅"
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="message" className={LABEL}>
          상세 내용
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          placeholder="행사 개요, 아티스트 역할(공연/진행/촬영 등), 콘텐츠 사용 범위(SNS/TVC/기간), 독점 조항 여부를 적어주시면 협의가 빨라져요."
          className="adv-glass w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-500/50"
        />
      </div>

      <div className="rounded-xl bg-white/[0.04] p-4 text-sm text-white/50">
        요청 발송은 무료입니다. 소속사가 수락하면 협의 채팅이 열리고, 견적 확정
        후에만 계약이 진행됩니다.
      </div>

      <button
        type="submit"
        className="premium-ease flex h-12 w-full items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white hover:bg-brand-600 hover:brand-glow"
      >
        섭외 요청 보내기
      </button>
    </form>
  );
}
