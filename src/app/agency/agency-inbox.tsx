"use client";

import { useState } from "react";
import { todayKST } from "@/lib/date";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useNotificationsStore } from "@/lib/notifications-store";
import { holdKey, useScheduleStore } from "@/lib/schedule-store";
import { useForecast } from "@/lib/use-forecast";
import { isRainRisky } from "@/lib/weather";
import {
  formatBudget,
  type Artist,
  type BookingRequest,
  type BookingStatus,
  type ScheduleDay,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/client";
import {
  Banknote,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CloudRain,
  FileScan,
  Loader2,
  MapPin,
  SendHorizonal,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

const TODAY = todayKST();
const HOLD_DAYS = 7; // 수락 시 홀드 유지 기간


interface Quote {
  amount: number;
  items: string;
  note: string;
}

// AI 공문 인식 데모 — 실제로는 업로드된 PDF/엑셀에서 추출한다
const AI_EXTRACTED: BookingRequest = {
  id: "r-ai",
  artistId: "a2",
  artistName: "QWER",
  companyName: "성동구청 문화체육과",
  companyVerified: true,
  companyEventCount: 5,
  eventType: "축제",
  budget: 4500,
  location: "서울숲 야외무대",
  date: "2026-08-22",
  message:
    "성동 여름밤 축제 헤드라이너 공연 요청 — 공문에서 자동 인식된 요청입니다. 원본: 섭외공문_성동구청.pdf",
  status: "pending",
  createdAt: "2026-07-07T11:00:00+09:00",
};

const ADVANCING_ITEMS = [
  "대기실 확보 확인",
  "음향·모니터 스펙 확인",
  "주차권 · 출입증 수령",
  "헤메코 공간 확인",
  "식사 · 다과 준비",
  "큐시트 최종본 수령",
];

// 체크리스트 항목(DB 저장값)의 표시용 번역 키 매핑
const ADVANCING_ITEM_KEYS: Record<string, string> = {
  "대기실 확보 확인": "agency.inbox.advWaitingRoom",
  "음향·모니터 스펙 확인": "agency.inbox.advSound",
  "주차권 · 출입증 수령": "agency.inbox.advParking",
  "헤메코 공간 확인": "agency.inbox.advGlam",
  "식사 · 다과 준비": "agency.inbox.advMeal",
  "큐시트 최종본 수령": "agency.inbox.advCuesheet",
};

// 행사 유형(데이터 enum)의 표시용 번역 키 매핑 (기존 booking.* 키 재사용)
const EVENT_TYPE_KEYS: Record<string, string> = {
  "행사": "booking.typeEvent",
  "광고": "booking.typeAd",
  "유튜브": "booking.typeYoutube",
  "예능": "booking.typeVariety",
  "팬미팅": "booking.typeFanmeeting",
  "축제": "booking.typeFestival",
  "강연": "booking.typeLecture",
};

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function AgencyInbox({
  initialRequests,
  artists,
  scheduleMap,
  initialQuotes = {},
}: {
  initialRequests: BookingRequest[];
  artists: Artist[];
  scheduleMap: Record<string, ScheduleDay[]>;
  initialQuotes?: Record<
    string,
    { amount: number; includes: string | null; note: string | null }
  >;
}) {
  const { t, locale } = useI18n();
  const [requests, setRequests] = useState<BookingRequest[]>(initialRequests);
  // 상태 변경 → DB PATCH + 로컬 반영
  const updateStatus = (id: string, status: BookingStatus) => {
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status } : r))
    );
    fetch("/api/booking-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => {});
  };
  const [selectedId, setSelectedId] = useState(requests[0]?.id);
  // DB 견적으로 초기화 → 새로고침해도 '견적 보냈어요' 유지
  const [quotes, setQuotes] = useState<Record<string, Quote>>(() =>
    Object.fromEntries(
      Object.entries(initialQuotes).map(([rid, q]) => [
        rid,
        { amount: q.amount, items: q.includes ?? "", note: q.note ?? "" },
      ])
    )
  );
  const [holdPlacedFor, setHoldPlacedFor] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteItems, setQuoteItems] = useState("");
  const [quoteNote, setQuoteNote] = useState("");
  const [aiState, setAiState] = useState<"idle" | "processing" | "done">(
    "idle"
  );
  // 어드밴싱 체크리스트 — DB advancing으로 초기화, 토글 시 저장
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      initialRequests.flatMap((r) =>
        (r.advancingChecked ?? []).map((item) => [`${r.id}:${item}`, true])
      )
    )
  );

  const { holds, placeHold } = useScheduleStore();
  const pushNotif = useNotificationsStore((s) => s.push);
  const visibleRequests = requests;

  const runAiIntake = () => {
    setAiState("processing");
    setTimeout(() => setAiState("done"), 1400);
  };

  // AI 공문 인식 데모 — 실제 QWER 아티스트로 DB에 요청 생성 (수락·견적 흐름까지 동작)
  const addAiRequest = async () => {
    if (requests.some((r) => r.message === AI_EXTRACTED.message)) {
      setSelectedId(
        requests.find((r) => r.message === AI_EXTRACTED.message)!.id
      );
      setAiState("idle");
      return;
    }
    const qwer = artists.find((a) => a.slug === "qwer") ?? artists[0];
    try {
      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistId: qwer?.id,
          companyName: AI_EXTRACTED.companyName,
          companyVerified: true,
          companyEventCount: AI_EXTRACTED.companyEventCount,
          eventType: AI_EXTRACTED.eventType,
          budget: AI_EXTRACTED.budget,
          location: AI_EXTRACTED.location,
          eventDate: AI_EXTRACTED.date,
          message: AI_EXTRACTED.message,
        }),
      });
      if (!res.ok) throw new Error();
      const { id } = (await res.json()) as { id: string };
      const created: BookingRequest = {
        ...AI_EXTRACTED,
        id,
        artistId: qwer?.id ?? AI_EXTRACTED.artistId,
        artistName: qwer?.name ?? AI_EXTRACTED.artistName,
      };
      setRequests((prev) => [created, ...prev]);
      setSelectedId(id);
    } catch {
      // API 실패 시 로컬 데모로 폴백
      setRequests((prev) => [AI_EXTRACTED, ...prev]);
      setSelectedId(AI_EXTRACTED.id);
    }
    setAiState("idle");
  };

  const toggleChecklist = (requestId: string, item: string) =>
    setChecklist((prev) => {
      const next = {
        ...prev,
        [`${requestId}:${item}`]: !prev[`${requestId}:${item}`],
      };
      // DB 저장 (해당 요청의 체크된 항목 전체)
      const checked = ADVANCING_ITEMS.filter((it) => next[`${requestId}:${it}`]);
      fetch("/api/booking-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId, advancingChecked: checked }),
      }).catch(() => {});
      return next;
    });

  const selected = requests.find((r) => r.id === selectedId);
  const outdoorEvent =
    selected && ["축제", "행사"].includes(selected.eventType);
  // 실 기상청 예보 (근접일) — mock 즉시 표시 후 업그레이드
  const forecast = useForecast(selected?.date, selected?.location);
  const rainRisk =
    selected && outdoorEvent && forecast && isRainRisky(forecast);
  const artist = selected
    ? artists.find((a) => a.id === selected.artistId)
    : undefined;
  const preset = artist?.quotePreset;

  // 요청일의 현재 상태 (기본 일정 + 홀드)
  const baseDay = selected
    ? (scheduleMap[selected.artistId] ?? []).find(
        (d) => d.date === selected.date
      )
    : undefined;
  const holdOnDate = selected
    ? holds[holdKey(selected.artistId, selected.date)]
    : undefined;
  const conflict =
    selected &&
    ((holdOnDate && holdOnDate.requestId !== selected.id) ||
      baseDay?.availability === "busy");

  const setStatus = (id: string, status: BookingStatus) => updateStatus(id, status);

  const accept = () => {
    if (!selected) return;
    setStatus(selected.id, "accepted");
    const holdPayload = {
      artistId: selected.artistId,
      date: selected.date,
      requestId: selected.id,
      companyName: selected.companyName,
      expiresAt: addDays(TODAY, HOLD_DAYS),
    };
    placeHold(holdPayload);
    // DB holds에도 기록 → 일정관리에 반영
    fetch("/api/holds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(holdPayload),
    }).catch(() => {});
    // 데일리 시트 자동 생성 → DB(day_schedules)에 실제 생성
    fetch("/api/day-schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artistId: selected.artistId,
        date: selected.date,
        title: `${selected.eventType} · ${selected.companyName}`,
        eventType: selected.eventType,
        manager: "자동 배정 대기",
        memo: "인박스 수락 · 자동 생성됨. 담당 매니저·차량을 배정해주세요.",
        stops: [
          { time: "08:00", label: "현장 도착", location: selected.location },
          { time: "10:00", label: "행사 진행" },
          { time: "17:00", label: "종료" },
        ],
      }),
    }).catch(() => {});
    pushNotif({
      type: "booking_accepted",
      role: "agency",
      title: t("agency.inbox.notifSheetTitle"),
      body: t("agency.inbox.notifSheetBody", {
        artist: selected.artistName,
        date: selected.date,
      }),
      link: "/agency/today",
    });
    setHoldPlacedFor(selected.id);
  };

  const sendQuote = () => {
    if (!selected || !quoteAmount) return;
    const amount = Number(quoteAmount);
    setQuotes((prev) => ({
      ...prev,
      [selected.id]: { amount, items: quoteItems, note: quoteNote },
    }));
    // DB 저장: quotes + 협의 메시지 + 상태 negotiating (API가 일괄 처리)
    fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requestId: selected.id,
        amount,
        includes: quoteItems,
        note: quoteNote,
        senderName: artist?.agencyName
          ? `${artist.agencyName} 담당자`
          : "소속사 담당자",
      }),
    }).catch(() => {});
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selected.id ? { ...r, status: "negotiating" } : r
      )
    );
    setQuoteAmount("");
    setQuoteItems("");
    setQuoteNote("");
  };

  const fillPreset = () => {
    if (!preset) return;
    setQuoteAmount(String(preset.baseFee));
    setQuoteItems(preset.includes);
    setQuoteNote(preset.note ?? "");
  };

  const selectRequest = (id: string) => {
    setSelectedId(id);
    setQuoteAmount("");
    setQuoteItems("");
    setQuoteNote("");
  };

  const sentQuote = selected ? quotes[selected.id] : undefined;

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
      {/* 요청 목록 */}
      <div className="space-y-2 lg:col-span-2">
        {/* AI 공문 인식 */}
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-4">
          {aiState === "idle" && (
            <button
              onClick={runAiIntake}
              className="flex w-full items-center gap-3 text-left"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                <FileScan className="h-4.5 w-4.5 text-brand-600" />
              </span>
              <span>
                <span className="block text-sm font-bold">
                  {t("agency.inbox.aiTitle")}{" "}
                  <span className="rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    BETA
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-neutral-400">
                  {t("agency.inbox.aiDesc")}
                </span>
              </span>
            </button>
          )}
          {aiState === "processing" && (
            <div className="flex items-center gap-3 py-1">
              <Loader2 className="h-4.5 w-4.5 animate-spin text-brand-500" />
              <p className="text-sm text-neutral-500">
                <span className="font-semibold text-neutral-900">
                  섭외공문_성동구청.pdf
                </span>{" "}
                {t("agency.inbox.aiAnalyzing")}
              </p>
            </div>
          )}
          {aiState === "done" && (
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-brand-700">
                <Sparkles className="h-3.5 w-3.5" /> {t("agency.inbox.aiDone")}
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-600">
                <span>{t("agency.inbox.aiHost")}: 성동구청 문화체육과</span>
                <span>{t("agency.inbox.aiTarget")}: QWER</span>
                <span>{t("agency.inbox.aiDate")}: 2026-08-22</span>
                <span>{t("agency.inbox.aiPlace")}: 서울숲 야외무대</span>
                <span>{t("agency.inbox.aiFee")}: 4,500만원</span>
                <span>
                  {t("agency.inbox.aiType")}: {t("booking.typeFestival")}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={addAiRequest}
                  className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  {t("agency.inbox.addAsRequest")}
                </button>
                <button
                  onClick={() => setAiState("idle")}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-900"
                >
                  {t("common.cancel")}
                </button>
              </div>
            </div>
          )}
        </div>

        {visibleRequests.map((req) => (
          <button
            key={req.id}
            onClick={() => selectRequest(req.id)}
            className={cn(
              "w-full rounded-2xl border bg-white p-4 text-left transition-colors",
              selectedId === req.id
                ? "border-neutral-900 ring-1 ring-neutral-900"
                : "border-neutral-200 hover:border-neutral-400"
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-sm font-bold">
                  {req.companyName}
                </span>
                {req.companyVerified ? (
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand-500" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-neutral-300" />
                )}
              </span>
              <StatusBadge status={req.status} />
            </div>
            <p className="mt-1 truncate text-xs text-neutral-500">
              {req.artistName} ·{" "}
              {EVENT_TYPE_KEYS[req.eventType]
                ? t(EVENT_TYPE_KEYS[req.eventType])
                : req.eventType}{" "}
              · {req.date}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-700">
              {t("agency.inbox.budget")} {formatBudget(req.budget, locale)}
            </p>
          </button>
        ))}
      </div>

      {/* 상세 + 응답 */}
      <div className="lg:col-span-3">
        {selected ? (
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold">
                    {selected.companyName}
                  </h2>
                  {selected.companyVerified ? (
                    <Badge variant="brand">
                      <ShieldCheck className="h-3 w-3" />{" "}
                      {t("agency.inbox.verified")}
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <ShieldAlert className="h-3 w-3" />{" "}
                      {t("agency.inbox.unverified")}
                    </Badge>
                  )}
                  <Badge>
                    {EVENT_TYPE_KEYS[selected.eventType]
                      ? t(EVENT_TYPE_KEYS[selected.eventType])
                      : selected.eventType}
                  </Badge>
                  <StatusBadge status={selected.status} />
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {t("agency.inbox.bookingRequestFor", {
                    artist: selected.artistName,
                  })}
                  {selected.companyVerified &&
                    selected.companyEventCount &&
                    t("agency.inbox.eventHistory", {
                      n: selected.companyEventCount,
                    })}
                </p>
              </div>
              {selected.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={accept}>
                    <Check className="h-3.5 w-3.5" /> {t("agency.inbox.accept")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus(selected.id, "rejected")}
                  >
                    <X className="h-3.5 w-3.5" /> {t("agency.inbox.reject")}
                  </Button>
                </div>
              )}
            </div>

            {/* 미인증 경고 */}
            {!selected.companyVerified && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <p>{t("agency.inbox.unverifiedWarn")}</p>
              </div>
            )}

            {/* 우천 리스크 (야외 행사 + 강수확률 60%↑) */}
            {rainRisk && forecast && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <CloudRain className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <p>
                  <span className="font-bold">
                    {t("agency.inbox.rainProb", {
                      date: selected!.date,
                      location: selected!.location,
                      prob: forecast.rainProb,
                    })}
                  </span>{" "}
                  {t("agency.inbox.rainWarn", { tier: forecast.tierLabel })}
                </p>
              </div>
            )}

            {/* 더블부킹 경고 */}
            {conflict && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <p>
                  <span className="font-bold">
                    {t("agency.inbox.conflictTitle", {
                      date: selected.date,
                      what: holdOnDate
                        ? t("agency.inbox.companyHold", {
                            company: holdOnDate.companyName ?? "",
                          })
                        : t("agency.inbox.unavailableSlot"),
                    })}
                  </span>{" "}
                  {t("agency.inbox.conflictWarn")}
                </p>
              </div>
            )}

            {/* 홀드 생성 확인 */}
            {holdPlacedFor === selected.id && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  <span className="font-bold">
                    {t("agency.inbox.holdCreated", { date: selected.date })}
                  </span>{" "}
                  {t("agency.inbox.holdExpiry", {
                    date: addDays(TODAY, HOLD_DAYS),
                  })}
                </p>
              </div>
            )}

            {/* 요청 조건 */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-neutral-50 px-4 py-3">
                <p className="flex items-center gap-1 text-xs text-neutral-400">
                  <Calendar className="h-3 w-3" /> {t("agency.inbox.desiredDate")}
                </p>
                <p className="mt-0.5 text-sm font-bold">{selected.date}</p>
                <p
                  className={cn(
                    "mt-0.5 text-xs font-semibold",
                    conflict
                      ? "text-brand-600"
                      : baseDay
                        ? "text-neutral-500"
                        : "text-neutral-400"
                  )}
                >
                  {holdOnDate
                    ? t("agency.inbox.onHold", {
                        company: holdOnDate.companyName ?? "",
                      })
                    : baseDay
                      ? t("agency.inbox.currentStatus", {
                          status: t(`avail.${baseDay.availability}`),
                        })
                      : t("agency.inbox.noSchedule")}
                </p>
              </div>
              <div className="rounded-xl bg-neutral-50 px-4 py-3">
                <p className="flex items-center gap-1 text-xs text-neutral-400">
                  <MapPin className="h-3 w-3" /> {t("agency.inbox.region")}
                </p>
                <p className="mt-0.5 text-sm font-bold">
                  {selected.location}
                </p>
              </div>
              <div className="rounded-xl bg-neutral-50 px-4 py-3">
                <p className="flex items-center gap-1 text-xs text-neutral-400">
                  <Banknote className="h-3 w-3" /> {t("agency.inbox.proposedBudget")}
                </p>
                <p className="mt-0.5 text-sm font-bold">
                  {formatBudget(selected.budget, locale)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-100 p-4">
              <p className="text-xs font-semibold text-neutral-400">
                {t("agency.inbox.requestContent")}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-700">
                {selected.message}
              </p>
            </div>

            {/* 어드밴싱 체크리스트 — 수락된 요청의 행사 준비 */}
            {selected.status === "accepted" && (
              <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-1.5 font-bold">
                      <ClipboardCheck className="h-4 w-4 text-brand-500" />
                      {t("agency.inbox.checklistTitle")}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-400">
                      {t("agency.inbox.checklistAutoSave")}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {ADVANCING_ITEMS.map((item) => {
                    const done = checklist[`${selected.id}:${item}`];
                    return (
                      <button
                        key={item}
                        onClick={() => toggleChecklist(selected.id, item)}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                          done
                            ? "border-brand-200 bg-brand-50/60 text-neutral-900"
                            : "border-neutral-100 bg-neutral-50/60 text-neutral-500 hover:border-neutral-300"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full",
                            done
                              ? "bg-brand-500 text-white"
                              : "bg-white ring-1 ring-neutral-300"
                          )}
                        >
                          {done && <Check className="h-3 w-3" />}
                        </span>
                        {ADVANCING_ITEM_KEYS[item]
                          ? t(ADVANCING_ITEM_KEYS[item])
                          : item}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 견적 */}
            {selected.status === "rejected" ? (
              <p className="mt-6 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">
                {t("agency.inbox.rejectedNote")}
              </p>
            ) : sentQuote ? (
              <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50/50 p-5">
                <p className="flex items-center gap-1.5 text-sm font-bold text-brand-700">
                  <CheckCircle2 className="h-4 w-4" />{" "}
                  {t("agency.inbox.quoteSent")}
                </p>
                <p className="mt-2 text-2xl font-black">
                  {formatBudget(sentQuote.amount, locale)}
                </p>
                {sentQuote.items && (
                  <p className="mt-1 text-sm text-neutral-600">
                    {t("agency.inbox.includesLabel")}: {sentQuote.items}
                  </p>
                )}
                <p className="mt-3 text-xs text-neutral-400">
                  {t("agency.inbox.quoteSentNote")}
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold">
                      {t("agency.inbox.quoteReply")}
                    </h3>
                    <p className="mt-1 text-xs text-neutral-400">
                      {t("agency.inbox.quoteReplyDesc")}
                    </p>
                  </div>
                  {preset && (
                    <button
                      onClick={fillPreset}
                      className="flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {t("agency.inbox.presetLabel", {
                        artist: selected.artistName,
                      })}{" "}
                      · {formatBudget(preset.baseFee, locale)}
                    </button>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="quote-amount">
                      {t("agency.inbox.totalAmount")}
                    </Label>
                    <Input
                      id="quote-amount"
                      type="number"
                      min={0}
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      placeholder={t("agency.inbox.amountPlaceholder", {
                        budget: selected.budget.toLocaleString(),
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quote-items">
                      {t("agency.inbox.includeItems")}
                    </Label>
                    <Input
                      id="quote-items"
                      value={quoteItems}
                      onChange={(e) => setQuoteItems(e.target.value)}
                      placeholder={t("agency.inbox.includeItemsPlaceholder")}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="quote-note">
                    {t("agency.inbox.memoOptional")}
                  </Label>
                  <Textarea
                    id="quote-note"
                    rows={2}
                    value={quoteNote}
                    onChange={(e) => setQuoteNote(e.target.value)}
                    placeholder={t("agency.inbox.memoPlaceholder")}
                  />
                </div>
                <Button
                  className="mt-4"
                  disabled={!quoteAmount}
                  onClick={sendQuote}
                >
                  <SendHorizonal className="h-3.5 w-3.5" />{" "}
                  {t("agency.inbox.sendQuote")}
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <Card className="flex h-64 items-center justify-center text-sm text-neutral-400">
            {t("agency.inbox.selectPrompt")}
          </Card>
        )}
      </div>
    </div>
  );
}
