import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getRequest, getThread } from "@/lib/mock-data";
import { formatBudget } from "@/lib/types";
import { MessageComposer } from "./message-composer";
import { cn } from "@/lib/utils";

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const request = getRequest(id);
  if (!request) notFound();
  const thread = getThread(id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {request.artistName}
        </h1>
        <Badge>{request.eventType}</Badge>
        <StatusBadge status={request.status} />
      </div>
      <p className="mt-1 text-sm text-neutral-500">
        {request.date} · {request.location} · 제안 예산{" "}
        {formatBudget(request.budget)}
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
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
            <MessageComposer />
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
  );
}
