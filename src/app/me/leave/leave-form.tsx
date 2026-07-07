"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useLeaveStore } from "@/lib/leave-store";
import { cn } from "@/lib/utils";

const ME = { id: "a5", name: "정하늘" };

const STATUS_STYLE = {
  pending: "bg-neutral-900 text-white",
  approved: "bg-brand-500 text-white",
  rejected: "bg-neutral-200 text-neutral-500",
} as const;

const STATUS_LABEL = {
  pending: "승인 대기",
  approved: "승인됨",
  rejected: "거절됨",
} as const;

export function LeaveForm() {
  const { requests, submit } = useLeaveStore();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const myRequests = requests.filter((r) => r.artistId === ME.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !reason) return;
    submit({
      artistId: ME.id,
      artistName: ME.name,
      startDate,
      endDate: endDate || startDate,
      reason,
    });
    setStartDate("");
    setEndDate("");
    setReason("");
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black tracking-tight">휴가 신청</h1>
      <p className="mt-1 text-sm text-neutral-500">
        승인되면 해당 날짜는 자동으로 섭외 불가 처리돼요
      </p>

      <Card className="mt-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="leave-start">시작일</Label>
              <Input
                id="leave-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="leave-end">종료일 (하루면 비워두세요)</Label>
              <Input
                id="leave-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="leave-reason">사유</Label>
            <Input
              id="leave-reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="예: 개인 일정, 병원, 가족 행사"
            />
          </div>
          <Button type="submit" disabled={!startDate || !reason}>
            신청하기
          </Button>
        </form>
      </Card>

      <h2 className="mt-8 text-lg font-bold">신청 내역</h2>
      <div className="mt-3 space-y-2">
        {myRequests.map((req) => (
          <Card
            key={req.id}
            className="flex items-center justify-between gap-3 p-4"
          >
            <div>
              <p className="text-sm font-bold">
                {req.startDate}
                {req.endDate !== req.startDate && ` ~ ${req.endDate}`}
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">{req.reason}</p>
            </div>
            <span
              className={cn(
                "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                STATUS_STYLE[req.status]
              )}
            >
              {STATUS_LABEL[req.status]}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
