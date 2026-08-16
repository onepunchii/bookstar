"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useAuthUi } from "@/lib/auth-ui-store";
import { useNotificationsStore } from "@/lib/notifications-store";
import type { Artist, EventType } from "@/lib/types";
import { formatBudget } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
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

const EVENT_TYPE_KEY: Record<EventType, string> = {
  행사: "booking.typeEvent",
  광고: "booking.typeAd",
  유튜브: "booking.typeYoutube",
  예능: "booking.typeVariety",
  팬미팅: "booking.typeFanmeeting",
  축제: "booking.typeFestival",
  강연: "booking.typeLecture",
};

// 초안 보관 — 카카오 로그인은 전체 페이지 리다이렉트라 폼이 언마운트된다.
// 브리프에 개인정보가 담기므로 sessionStorage(탭 닫으면 소멸)만 쓰고, 제출 성공 시 지운다.
const DRAFT_PREFIX = "xong-booking-draft:";

interface BookingDraft {
  fields?: Record<string, string>;
  eventType?: string;
}

const LABEL = "mb-1.5 block text-sm font-medium text-white/70";
const FIELD =
  "adv-glass h-11 w-full rounded-xl px-3.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-500/50";

export interface SetInfo {
  title: string;
  members: string; // "리센느 · QWER · 이준호"
  budgetMin: number; // 만원
}

export function BookingForm({
  artist,
  setInfo,
}: {
  artist: Artist;
  setInfo?: SetInfo;
}) {
  const { t, locale } = useI18n();
  const [submitted, setSubmitted] = useState(false);
  const [eventType, setEventType] = useState<EventType>("행사");
  const pushNotif = useNotificationsStore((s) => s.push);
  const { isLoggedIn, openLogin } = useAuthUi();

  const formRef = useRef<HTMLFormElement | null>(null);
  const restored = useRef(false);
  const draftKey = `${DRAFT_PREFIX}${artist.slug}`;

  /**
   * 복원은 **폼이 실제로 붙는 순간** 한다 (ref 콜백).
   *
   * 처음에는 useEffect + formRef 로 했는데, 프로덕션에서 초안이 한 번도 저장되지
   * 않았다(2026-08-17 실측: sessionStorage 키 0개). 마운트 시점에 formRef.current 가
   * 아직 null 이어서 effect 가 `if (!form) return` 으로 빠졌고, 그러면
   * restored 플래그가 켜지지 않아 saveDraft 가 영구히 조기 반환했다. deps 가
   * [draftKey] 라 effect 가 다시 돌 일도 없어서 되살아나지 못했다.
   *
   * ref 콜백은 노드가 붙는 그 순간 호출되므로 null 을 만날 일이 없다.
   */
  const attachForm = useCallback(
    (node: HTMLFormElement | null) => {
      formRef.current = node;
      if (!node || restored.current) return;
      restored.current = true; // 폼이 붙은 뒤부터 저장을 허용한다(빈 폼이 초안을 덮어쓰는 것 방지)

      let raw: string | null = null;
      try {
        raw = sessionStorage.getItem(draftKey);
      } catch {
        // 스토리지 차단 환경(시크릿 모드 등) — 초안 없이 진행
      }
      if (!raw) return;
      try {
        const draft = JSON.parse(raw) as BookingDraft;
        for (const [name, value] of Object.entries(draft.fields ?? {})) {
          const el = node.elements.namedItem(name);
          if (el instanceof HTMLInputElement) el.value = value;
          else if (el instanceof HTMLTextAreaElement) el.value = value;
          // select 의 option value 는 번역된 라벨이라, 저장 후 언어가 바뀌면
          // 일치하는 항목이 없다. 그때 대입하면 선택이 비어버리므로 건너뛴다.
          else if (
            el instanceof HTMLSelectElement &&
            Array.from(el.options).some((o) => o.value === value)
          )
            el.value = value;
        }
        if (EVENT_TYPES.includes(draft.eventType as EventType)) {
          setEventType(draft.eventType as EventType);
        }
      } catch {
        // 손상된 초안 무시
      }
    },
    [draftKey]
  );

  const saveDraft = useCallback(
    (type: EventType) => {
      const form = formRef.current;
      if (!form || !restored.current) return;
      const fields: Record<string, string> = {};
      for (const [name, value] of new FormData(form).entries()) {
        if (typeof value === "string") fields[name] = value;
      }
      try {
        sessionStorage.setItem(
          draftKey,
          JSON.stringify({ fields, eventType: type } satisfies BookingDraft)
        );
      } catch {
        // 스토리지 차단·용량 초과 — 초안 없이 계속 진행
      }
    },
    [draftKey]
  );

  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      // 무시
    }
  }, [draftKey]);

  if (submitted) {
    return (
      <div className="adv-card mt-8 rounded-[1.75rem] p-10 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-brand-500" />
        <h2 className="mt-4 text-xl font-bold text-white">
          {t("booking.successTitle")}
        </h2>
        <p className="mt-2 text-sm text-white/55">
          {t("booking.successAvgLead", { agency: artist.agencyName })}{" "}
          <span className="font-semibold text-white">
            {t("booking.successHours", { hours: artist.responseHours })}
          </span>{" "}
          {t("booking.successReplyWithin")}
          <br />
          {t("booking.successNotify")}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/requests"
            className="premium-ease inline-flex h-11 items-center rounded-xl bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-600"
          >
            {t("booking.viewMyRequests")}
          </Link>
          <Link
            href="/artists"
            className="premium-ease inline-flex h-11 items-center rounded-xl bg-white/5 px-5 text-sm font-bold text-white/80 ring-1 ring-white/10 hover:text-white"
          >
            {t("booking.viewOtherArtists")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      ref={attachForm}
      className="mt-8 space-y-6"
      onChange={() => saveDraft(eventType)}
      onSubmit={async (e) => {
        e.preventDefault();
        // 로그인 게이트 — 비로그인 시 모달로 카카오 간편가입 유도(요청이 데모로 새는 것 방지)
        if (!isLoggedIn) {
          openLogin(t("booking.loginRequired"));
          return;
        }
        const form = new FormData(e.currentTarget);
        const budget = Number(form.get("budget") ?? 0);
        try {
          const res = await fetch("/api/booking-requests", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              artistId: artist.id,
              companyName:
                String(form.get("companyName") ?? "").trim() || undefined,
              companyVerified: true,
              companyEventCount: 12,
              eventType,
              budget,
              location: String(form.get("location") ?? ""),
              eventDate: String(form.get("date") ?? "2026-07-24"),
              message: String(form.get("message") ?? ""),
            }),
          });
          if (!res.ok) throw new Error();
          const { id } = (await res.json()) as { id: string };
          pushNotif({
            type: "new_request",
            role: "agency",
            title: t("booking.notifAgencyTitle"),
            body: t("booking.notifAgencyBody", {
              name: artist.name,
              eventType: t(EVENT_TYPE_KEY[eventType]),
              budget,
            }),
            link: "/agency/inbox",
          });
          pushNotif({
            type: "new_request",
            role: "company",
            title: t("booking.notifCompanyTitle"),
            body: t("booking.notifCompanyBody", { name: artist.name }),
            link: `/requests/${id}`,
          });
          clearDraft();
          setSubmitted(true);
        } catch {
          alert(t("booking.submitError"));
        }
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
            {t("booking.artistBudget", {
              agency: artist.agencyName,
              min: formatBudget(artist.budgetRange[0], locale),
              max: formatBudget(artist.budgetRange[1], locale),
            })}
          </p>
        </div>
      </div>

      {setInfo && (
        <div className="adv-glass rounded-2xl p-4 ring-1 ring-brand-500/30">
          <p className="text-xs font-bold text-brand-300">
            {t("booking.setInquiry")}
          </p>
          <p className="mt-1 text-sm font-semibold text-white">
            {setInfo.title}
          </p>
          <p className="mt-0.5 text-xs text-white/50">{setInfo.members}</p>
        </div>
      )}

      <div>
        <p className={LABEL}>{t("booking.eventTypeLabel")}</p>
        <div className="flex flex-wrap gap-2">
          {EVENT_TYPES.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                setEventType(opt);
                saveDraft(opt);
              }}
              className={cn(
                "premium-ease rounded-full px-4 py-2 text-sm font-medium",
                eventType === opt
                  ? "bg-brand-500 text-white"
                  : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:text-white"
              )}
            >
              {t(EVENT_TYPE_KEY[opt])}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className={LABEL}>
            {t("booking.dateLabel")}
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
            {t("booking.budgetLabel")}
          </label>
          <input
            id="budget"
            name="budget"
            type="number"
            required
            placeholder={t("booking.budgetPlaceholder")}
            min={0}
            defaultValue={setInfo?.budgetMin}
            className={FIELD}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="location" className={LABEL}>
            {t("booking.locationLabel")}
          </label>
          <input
            id="location"
            name="location"
            required
            placeholder={t("booking.locationPlaceholder")}
            className={FIELD}
          />
        </div>
        <div>
          <label htmlFor="duration" className={LABEL}>
            {t("booking.durationLabel")}
          </label>
          <select
            id="duration"
            name="duration"
            defaultValue={t("booking.duration2to4")}
            className={FIELD}
          >
            <option className="bg-neutral-900">
              {t("booking.durationUnder2")}
            </option>
            <option className="bg-neutral-900">
              {t("booking.duration2to4")}
            </option>
            <option className="bg-neutral-900">
              {t("booking.durationHalfDay")}
            </option>
            <option className="bg-neutral-900">
              {t("booking.durationFullDay")}
            </option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="brand" className={LABEL}>
          {t("booking.brandLabel")}
        </label>
        <input
          id="brand"
          name="companyName"
          placeholder={t("booking.brandPlaceholder")}
          className={FIELD}
        />
      </div>

      <div>
        <label htmlFor="message" className={LABEL}>
          {t("booking.messageLabel")}
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          defaultValue={
            setInfo
              ? t("booking.setPrefill", {
                  title: setInfo.title,
                  members: setInfo.members,
                })
              : undefined
          }
          placeholder={t("booking.messagePlaceholder")}
          className="adv-glass w-full rounded-xl px-3.5 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-500/50"
        />
      </div>

      <div className="rounded-xl bg-white/[0.04] p-4 text-sm text-white/50">
        {t("booking.feeNote")}
      </div>

      <button
        type="submit"
        className="premium-ease flex h-12 w-full items-center justify-center rounded-xl bg-brand-500 text-sm font-bold text-white hover:bg-brand-600 hover:brand-glow"
      >
        {t("booking.submitCta")}
      </button>
    </form>
  );
}
