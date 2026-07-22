"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import type { LeaveRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

const STATUS_STYLE = {
  pending: "bg-neutral-900 text-white",
  approved: "bg-brand-500 text-white",
  rejected: "bg-neutral-200 text-neutral-500",
} as const;

const STATUS_LABEL = {
  pending: "me.leave.statusPending",
  approved: "me.leave.statusApproved",
  rejected: "me.leave.statusRejected",
} as const;

export function LeaveForm({
  artistId,
  artistName,
  initialRequests,
}: {
  artistId: string;
  artistName: string;
  initialRequests: LeaveRequest[];
}) {
  const t = useT();
  const [myRequests, setMyRequests] =
    useState<LeaveRequest[]>(initialRequests);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !reason || saving) return;
    setSaving(true);
    const end = endDate || startDate;
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ artistId, startDate, endDate: end, reason }),
      });
      if (!res.ok) throw new Error();
      const { id } = (await res.json()) as { id: string };
      setMyRequests((prev) => [
        {
          id,
          artistId,
          artistName,
          startDate,
          endDate: end,
          reason,
          status: "pending",
        },
        ...prev,
      ]);
      setStartDate("");
      setEndDate("");
      setReason("");
    } catch {
      /* 무시 */
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black tracking-tight">{t("me.leave.title")}</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {t("me.leave.subtitle")}
      </p>

      <Card className="mt-6 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="leave-start">{t("me.leave.startDate")}</Label>
              <Input
                id="leave-start"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="leave-end">{t("me.leave.endDate")}</Label>
              <Input
                id="leave-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="leave-reason">{t("me.leave.reason")}</Label>
            <Input
              id="leave-reason"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("me.leave.reasonPlaceholder")}
            />
          </div>
          <Button type="submit" disabled={!startDate || !reason}>
            {t("me.leave.submit")}
          </Button>
        </form>
      </Card>

      <h2 className="mt-8 text-lg font-bold">{t("me.leave.historyTitle")}</h2>
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
              {t(STATUS_LABEL[req.status])}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
