"use client";

import { useState } from "react";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useNotificationsStore } from "@/lib/notifications-store";
import { holdKey, useScheduleStore } from "@/lib/schedule-store";
import { getForecast, isRainRisky } from "@/lib/weather";
import {
  AVAILABILITY_LABELS,
  formatBudget,
  type Artist,
  type BookingRequest,
  type BookingStatus,
  type ScheduleDay,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Banknote,
  Calendar,
  CalendarClock,
  Check,
  CheckCircle2,
  ClipboardCheck,
  CloudRain,
  FileScan,
  Link2,
  Loader2,
  MapPin,
  SendHorizonal,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

const TODAY = "2026-07-07";
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

function addDays(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function AgencyInbox({
  initialRequests,
  artists,
  scheduleMap,
}: {
  initialRequests: BookingRequest[];
  artists: Artist[];
  scheduleMap: Record<string, ScheduleDay[]>;
}) {
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
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [holdPlacedFor, setHoldPlacedFor] = useState<string | null>(null);
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteItems, setQuoteItems] = useState("");
  const [quoteNote, setQuoteNote] = useState("");
  const [aiState, setAiState] = useState<"idle" | "processing" | "done">(
    "idle"
  );
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [linkCopied, setLinkCopied] = useState(false);

  const { holds, placeHold } = useScheduleStore();
  const pushNotif = useNotificationsStore((s) => s.push);
  const visibleRequests = requests;

  const runAiIntake = () => {
    setAiState("processing");
    setTimeout(() => setAiState("done"), 1400);
  };

  // AI 공문 인식 데모 — 로컬 요청 카드로 추가(데모, 미저장)
  const addAiRequest = () => {
    if (!requests.some((r) => r.id === AI_EXTRACTED.id)) {
      setRequests((prev) => [AI_EXTRACTED, ...prev]);
    }
    setSelectedId(AI_EXTRACTED.id);
    setAiState("idle");
  };

  const toggleChecklist = (requestId: string, item: string) =>
    setChecklist((prev) => ({
      ...prev,
      [`${requestId}:${item}`]: !prev[`${requestId}:${item}`],
    }));

  const copyShareLink = () => {
    navigator.clipboard
      ?.writeText("https://xong.co.kr/advancing/x8f2k1")
      .catch(() => {});
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const selected = requests.find((r) => r.id === selectedId);
  const outdoorEvent =
    selected && ["축제", "행사"].includes(selected.eventType);
  const forecast = selected
    ? getForecast(selected.date, selected.location)
    : undefined;
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
      title: "데일리 시트 자동 생성",
      body: `${selected.artistName} · ${selected.date} · 담당 매니저 배정 필요`,
      link: "/agency/today",
    });
    setHoldPlacedFor(selected.id);
  };

  const sendQuote = () => {
    if (!selected || !quoteAmount) return;
    setQuotes((prev) => ({
      ...prev,
      [selected.id]: {
        amount: Number(quoteAmount),
        items: quoteItems,
        note: quoteNote,
      },
    }));
    setStatus(selected.id, "negotiating");
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
                  AI 공문 인식{" "}
                  <span className="rounded bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    BETA
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-neutral-400">
                  공문·큐시트 PDF를 올리면 날짜·출연료·담당자를 추출해 요청
                  카드로 만들어요
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
                분석 중…
              </p>
            </div>
          )}
          {aiState === "done" && (
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold text-brand-700">
                <Sparkles className="h-3.5 w-3.5" /> 인식 완료
              </p>
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-neutral-600">
                <span>주최: 성동구청 문화체육과</span>
                <span>대상: QWER</span>
                <span>일시: 2026-08-22</span>
                <span>장소: 서울숲 야외무대</span>
                <span>출연료: 4,500만원</span>
                <span>유형: 축제</span>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={addAiRequest}
                  className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
                >
                  요청으로 추가
                </button>
                <button
                  onClick={() => setAiState("idle")}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-400 hover:text-neutral-900"
                >
                  취소
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
              {req.artistName} · {req.eventType} · {req.date}
            </p>
            <p className="mt-0.5 text-xs font-semibold text-neutral-700">
              예산 {formatBudget(req.budget)}
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
                      <ShieldCheck className="h-3 w-3" /> 사업자 인증
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <ShieldAlert className="h-3 w-3" /> 미인증 주최자
                    </Badge>
                  )}
                  <Badge>{selected.eventType}</Badge>
                  <StatusBadge status={selected.status} />
                </div>
                <p className="mt-1 text-sm text-neutral-500">
                  {selected.artistName} 섭외 요청
                  {selected.companyVerified &&
                    selected.companyEventCount &&
                    ` · 플랫폼 행사 이력 ${selected.companyEventCount}회`}
                </p>
              </div>
              {selected.status === "pending" && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={accept}>
                    <Check className="h-3.5 w-3.5" /> 수락
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setStatus(selected.id, "rejected")}
                  >
                    <X className="h-3.5 w-3.5" /> 거절
                  </Button>
                </div>
              )}
            </div>

            {/* 미인증 경고 */}
            {!selected.companyVerified && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
                <p>
                  사업자 인증이 완료되지 않은 주최자예요. 계약 전 신원 확인을
                  권장하며, 에스크로 결제(2차 오픈)를 사용하면 안전하게 진행할
                  수 있어요.
                </p>
              </div>
            )}

            {/* 우천 리스크 (야외 행사 + 강수확률 60%↑) */}
            {rainRisk && forecast && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <CloudRain className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <p>
                  <span className="font-bold">
                    {selected!.date} {selected!.location} 강수확률{" "}
                    {forecast.rainProb}%
                  </span>{" "}
                  · 야외 행사예요. 우천 시 대체 계획을 미리 요청하세요. (
                  {forecast.tierLabel})
                </p>
              </div>
            )}

            {/* 더블부킹 경고 */}
            {conflict && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-3 text-sm text-brand-800">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" />
                <p>
                  <span className="font-bold">
                    {selected.date}은 이미{" "}
                    {holdOnDate
                      ? `${holdOnDate.companyName} 홀드`
                      : "불가 일정"}
                    이 있어요.
                  </span>{" "}
                  수락하면 더블부킹이 됩니다. 일정을 먼저 확인하세요.
                </p>
              </div>
            )}

            {/* 홀드 생성 확인 */}
            {holdPlacedFor === selected.id && (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  <span className="font-bold">
                    {selected.date}에 홀드가 자동 생성됐어요.
                  </span>{" "}
                  {addDays(TODAY, HOLD_DAYS)}까지 계약이 확정되지 않으면
                  자동으로 풀립니다. 일정 관리에서 확인하세요.
                </p>
              </div>
            )}

            {/* 요청 조건 */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-neutral-50 px-4 py-3">
                <p className="flex items-center gap-1 text-xs text-neutral-400">
                  <Calendar className="h-3 w-3" /> 희망 날짜
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
                    ? `홀드 중 (${holdOnDate.companyName})`
                    : baseDay
                      ? `현재 ${AVAILABILITY_LABELS[baseDay.availability]}`
                      : "일정 미등록"}
                </p>
              </div>
              <div className="rounded-xl bg-neutral-50 px-4 py-3">
                <p className="flex items-center gap-1 text-xs text-neutral-400">
                  <MapPin className="h-3 w-3" /> 지역
                </p>
                <p className="mt-0.5 text-sm font-bold">
                  {selected.location}
                </p>
              </div>
              <div className="rounded-xl bg-neutral-50 px-4 py-3">
                <p className="flex items-center gap-1 text-xs text-neutral-400">
                  <Banknote className="h-3 w-3" /> 제안 예산
                </p>
                <p className="mt-0.5 text-sm font-bold">
                  {formatBudget(selected.budget)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-100 p-4">
              <p className="text-xs font-semibold text-neutral-400">
                요청 내용
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
                      행사 준비 체크리스트
                    </h3>
                    <p className="mt-1 text-xs text-neutral-400">
                      주최측과 공유 링크로 함께 준비 상황을 확인해요
                    </p>
                  </div>
                  <button
                    onClick={copyShareLink}
                    className="flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-2 text-xs font-semibold text-neutral-600 transition-colors hover:border-neutral-900"
                  >
                    {linkCopied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-brand-500" />{" "}
                        복사됨
                      </>
                    ) : (
                      <>
                        <Link2 className="h-3.5 w-3.5" /> 주최측 공유 링크
                      </>
                    )}
                  </button>
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
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 견적 */}
            {selected.status === "rejected" ? (
              <p className="mt-6 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500">
                거절한 요청입니다. 사유는 광고주에게 자동 안내됐어요.
              </p>
            ) : sentQuote ? (
              <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50/50 p-5">
                <p className="flex items-center gap-1.5 text-sm font-bold text-brand-700">
                  <CheckCircle2 className="h-4 w-4" /> 견적을 보냈어요
                </p>
                <p className="mt-2 text-2xl font-black">
                  {formatBudget(sentQuote.amount)}
                </p>
                {sentQuote.items && (
                  <p className="mt-1 text-sm text-neutral-600">
                    포함: {sentQuote.items}
                  </p>
                )}
                <p className="mt-3 text-xs text-neutral-400">
                  광고주가 수락하면 계약 단계로 진행됩니다. 협의 채팅으로
                  조건을 조율할 수 있어요.
                </p>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-neutral-200 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-bold">견적 회신</h3>
                    <p className="mt-1 text-xs text-neutral-400">
                      견적을 보내면 자동으로 협의 상태로 전환됩니다
                    </p>
                  </div>
                  {preset && (
                    <button
                      onClick={fillPreset}
                      className="flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {selected.artistName} 프리셋 ·{" "}
                      {formatBudget(preset.baseFee)}
                    </button>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="quote-amount">총액 (만원)</Label>
                    <Input
                      id="quote-amount"
                      type="number"
                      min={0}
                      value={quoteAmount}
                      onChange={(e) => setQuoteAmount(e.target.value)}
                      placeholder={`제안 예산 ${selected.budget.toLocaleString()}만원`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quote-items">포함 항목</Label>
                    <Input
                      id="quote-items"
                      value={quoteItems}
                      onChange={(e) => setQuoteItems(e.target.value)}
                      placeholder="예: 출연 2시간 + SNS 포스팅 1회"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor="quote-note">메모 (선택)</Label>
                  <Textarea
                    id="quote-note"
                    rows={2}
                    value={quoteNote}
                    onChange={(e) => setQuoteNote(e.target.value)}
                    placeholder="조건, 협의 가능 범위 등"
                  />
                </div>
                <Button
                  className="mt-4"
                  disabled={!quoteAmount}
                  onClick={sendQuote}
                >
                  <SendHorizonal className="h-3.5 w-3.5" /> 견적 보내기
                </Button>
              </div>
            )}
          </Card>
        ) : (
          <Card className="flex h-64 items-center justify-center text-sm text-neutral-400">
            왼쪽에서 요청을 선택하세요
          </Card>
        )}
      </div>
    </div>
  );
}
