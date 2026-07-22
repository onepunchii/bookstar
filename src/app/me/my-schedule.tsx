"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { todayKST } from "@/lib/date";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { WeatherBadge } from "@/components/weather-badge";
import type { DaySchedule, LeaveRequest } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  Car,
  ChevronRight,
  Clock,
  MapPin,
  Navigation,
  Palmtree,
  UserRound,
} from "lucide-react";

const TODAY = todayKST();

function formatToday(iso: string) {
  const d = new Date(iso);
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`;
}

export function MySchedule({
  schedules,
  artistName,
  leaves,
}: {
  schedules: DaySchedule[];
  artistName: string;
  leaves: LeaveRequest[];
}) {
  const t = useT();
  const myLeaves = leaves;
  const today = schedules.find((s) => s.date === TODAY);
  const upcoming = schedules.filter((s) => s.date > TODAY);
  const callTime = today?.stops[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-black tracking-tight">
        {t("me.schedule.greeting", { name: artistName })}
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {formatToday(TODAY)} · {t("me.schedule.today")}
      </p>

      {/* 오늘의 콜타임 */}
      {today && callTime ? (
        <Card className="mt-6 overflow-hidden">
          <div className="bg-neutral-950 p-6 text-white">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400">
              <Clock className="h-3.5 w-3.5 text-brand-500" />{" "}
              {t("me.schedule.callTime")}
            </p>
            <p className="mt-2 text-4xl font-black">
              {callTime.time}
              <span className="ml-2 text-lg font-bold text-brand-500">
                {callTime.label}
              </span>
            </p>
            <p className="mt-1 text-sm text-neutral-400">
              {today.title} · {callTime.location}
            </p>
            <div className="mt-3">
              <WeatherBadge date={today.date} location={callTime.location} />
            </div>
          </div>
          <div className="p-5">
            {/* 타임라인 */}
            <ol className="space-y-0">
              {today.stops.map((stop, i) => (
                <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < today.stops.length - 1 && (
                    <span className="absolute left-[7px] top-5 h-full w-px bg-neutral-200" />
                  )}
                  <span
                    className={cn(
                      "relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-2 border-white",
                      i === 0
                        ? "bg-brand-500 ring-2 ring-brand-200"
                        : "bg-neutral-300"
                    )}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">
                        {stop.time}{" "}
                        <span className="font-semibold text-neutral-600">
                          {stop.label}
                        </span>
                      </p>
                      {stop.location && (
                        <a
                          href={`https://map.kakao.com/link/search/${encodeURIComponent(stop.location)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 transition-colors hover:bg-brand-100"
                        >
                          <Navigation className="h-3 w-3" />{" "}
                          {t("me.schedule.navigate")}
                        </a>
                      )}
                    </div>
                    {stop.location && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-400">
                        <MapPin className="h-3 w-3" /> {stop.location}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-neutral-100 pt-4 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <UserRound className="h-3.5 w-3.5 text-neutral-400" />{" "}
                {t("me.schedule.manager", { name: today.manager })}
              </span>
              {today.vehicle && (
                <span className="flex items-center gap-1.5">
                  <Car className="h-3.5 w-3.5 text-neutral-400" />
                  {today.vehicle}
                </span>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mt-6 flex h-40 flex-col items-center justify-center gap-1 text-neutral-400">
          <p className="font-semibold">{t("me.schedule.noToday")}</p>
          <p className="text-sm">{t("me.schedule.rest")}</p>
        </Card>
      )}

      {/* 다가오는 일정 */}
      <h2 className="mt-8 text-lg font-bold">{t("me.schedule.upcoming")}</h2>
      <div className="mt-3 space-y-2">
        {upcoming.length === 0 ? (
          <p className="text-sm text-neutral-400">
            {t("me.schedule.upcomingEmpty")}
          </p>
        ) : (
          upcoming.map((s) => (
            <Card key={s.id} className="flex items-center gap-4 p-4">
              <div className="w-14 shrink-0 text-center">
                <p className="text-xs text-neutral-400">
                  {t("me.schedule.monthLabel", { n: Number(s.date.slice(5, 7)) })}
                </p>
                <p className="text-xl font-black">
                  {Number(s.date.slice(8))}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{s.title}</p>
                <p className="mt-0.5 text-xs text-neutral-400">
                  {s.stops[0].time} {s.stops[0].label} ·{" "}
                  {s.stops[0].location}
                </p>
              </div>
              <Badge>{s.eventType}</Badge>
            </Card>
          ))
        )}
      </div>

      {/* 휴가 현황 */}
      <Link href="/me/leave" className="group mt-6 block">
        <Card className="flex items-center gap-4 p-4 transition-colors group-hover:border-neutral-900">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50">
            <Palmtree className="h-4.5 w-4.5 text-brand-600" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold">{t("me.schedule.leaveTitle")}</p>
            <p className="mt-0.5 text-xs text-neutral-400">
              {myLeaves.filter((l) => l.status === "pending").length > 0
                ? t("me.schedule.pendingCount", {
                    n: myLeaves.filter((l) => l.status === "pending").length,
                  })
                : t("me.schedule.noPending")}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-neutral-300" />
        </Card>
      </Link>
    </div>
  );
}
