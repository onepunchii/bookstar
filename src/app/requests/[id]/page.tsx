"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { LeaveReviewCard } from "@/components/leave-review-card";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { allRequests, useBookingsStore } from "@/lib/bookings-store";
import { getThread } from "@/lib/mock-data";
import { formatBudget } from "@/lib/types";
import { MessageComposer } from "./message-composer";
import { cn } from "@/lib/utils";

export default function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const extra = useBookingsStore((s) => s.extra);
  const overrides = useBookingsStore((s) => s.overrides);
  const threads = useBookingsStore((s) => s.threads);
  const request = allRequests(extra, overrides).find((r) => r.id === id);
  if (!request) notFound();
  const thread = [...getThread(id), ...(threads[id] ?? [])];

  return (
    <div className="adv-dark min-h-dvh">
      <div className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="display-kr text-3xl font-black text-white">
            {request.artistName}
          </h1>
          <Badge>{request.eventType}</Badge>
          <StatusBadge status={request.status} />
        </div>
        <p className="mt-2 text-sm text-white/50">
          {request.date} · {request.location} · 제안 예산{" "}
          {formatBudget(request.budget)}
        </p>

        {/* 채팅·요약은 라이트 워킹 시트 */}
        <div className="mt-8 rounded-[2rem] bg-white p-5 shadow-2xl shadow-black/40 sm:p-7">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Thread */}
        <div className="lg:col-span-2">
          <Card className="flex h-[560px] flex-col">
            <div className="border-b border-neutral-100 px-5 py-3 text-sm font-semibold">
              협의 채팅
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {thread.length === 0 && (
                <p className="py-16 text-center text-sm text-neutral-400">
                  아직 메시지가 없어요. 소속사 응답을 기다리는 중입니다.
                </p>
              )}
              {thread.map((msg) =>
                msg.sender === "system" ? (
                  <p
                    key={msg.id}
                    className="text-center text-xs text-neutral-400"
                  >
                    {msg.body}
                  </p>
                ) : (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex flex-col",
                      msg.sender === "company" ? "items-end" : "items-start"
                    )}
                  >
                    <span className="mb-1 text-xs text-neutral-400">
                      {msg.senderName}
                    </span>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        msg.sender === "company"
                          ? "rounded-br-md bg-brand-500 text-white"
                          : "rounded-bl-md bg-neutral-100 text-neutral-900"
                      )}
                    >
                      {msg.body}
                    </div>
                  </div>
                )
              )}
            </div>
            <MessageComposer requestId={id} />
          </Card>
        </div>

        {/* Summary sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="text-sm font-bold">요청 내용</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {request.message}
            </p>
          </Card>
          {request.status === "negotiating" && (
            <Card className="border-brand-200 bg-brand-50/50 p-5">
              <h3 className="text-sm font-bold text-brand-700">최근 견적</h3>
              <p className="mt-2 text-2xl font-black">
                {formatBudget(1800)}
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                언박싱 + 브이로그 + 라이브커머스 1회 포함
              </p>
              <p className="mt-3 text-xs text-neutral-400">
                견적 수락 시 전자계약 단계로 넘어갑니다 (2차 오픈 예정)
              </p>
            </Card>
          )}
          {(request.status === "accepted" ||
            request.status === "completed") && (
            <LeaveReviewCard
              artistId={request.artistId}
              artistName={request.artistName}
              companyName={request.companyName}
              eventTitle={`${request.eventType} · ${request.date}`}
            />
          )}
          <Card className="p-5">
            <h3 className="text-sm font-bold">진행 단계</h3>
            <ol className="mt-3 space-y-2 text-sm">
              {["요청 발송", "소속사 검토", "협의", "계약", "완료"].map(
                (step, i) => {
                  const activeIdx =
                    request.status === "pending"
                      ? 0
                      : request.status === "reviewing"
                        ? 1
                        : request.status === "negotiating"
                          ? 2
                          : request.status === "accepted"
                            ? 3
                            : 4;
                  return (
                    <li key={step} className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                          i <= activeIdx
                            ? "bg-brand-500 text-white"
                            : "bg-neutral-100 text-neutral-400"
                        )}
                      >
                        {i + 1}
                      </span>
                      <span
                        className={
                          i <= activeIdx
                            ? "font-medium text-neutral-900"
                            : "text-neutral-400"
                        }
                      >
                        {step}
                      </span>
                    </li>
                  );
                }
              )}
            </ol>
          </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
