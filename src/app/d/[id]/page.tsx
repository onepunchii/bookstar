import { notFound } from "next/navigation";
import { WeatherBadge } from "@/components/weather-badge";
import { Wordmark } from "@/components/wordmark";
import { DAY_SCHEDULES } from "@/lib/mock-data";
import { Car, MapPin, UserRound } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const dow = ["일", "월", "화", "수", "목", "금", "토"][d.getDay()];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${dow})`;
}

export default async function SharedDaySheetPage({ params }: Props) {
  const { id } = await params;
  const schedule = DAY_SCHEDULES.find((s) => s.id === id);
  if (!schedule) notFound();

  return (
    <div className="min-h-dvh bg-neutral-50">
      {/* 얇은 브랜드 바 */}
      <div className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-12 max-w-xl items-center justify-between px-4">
          <Wordmark height={18} />
          <span className="text-xs text-neutral-400">데일리 시트</span>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-sm text-neutral-500">{formatDate(schedule.date)}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-black tracking-tight">
            {schedule.artistName}
          </h1>
          <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-bold text-white">
            {schedule.eventType}
          </span>
          <WeatherBadge
            date={schedule.date}
            location={schedule.stops[0]?.location}
          />
        </div>
        <p className="mt-1 text-sm text-neutral-600">{schedule.title}</p>

        {/* 타임라인 */}
        <ol className="mt-6 space-y-0 rounded-2xl border border-neutral-200 bg-white p-6">
          {schedule.stops.map((stop, i) => (
            <li key={i} className="relative flex gap-4 pb-5 last:pb-0">
              {i < schedule.stops.length - 1 && (
                <span className="absolute left-[9px] top-6 h-full w-px bg-neutral-200" />
              )}
              <span
                className={`relative mt-1 h-[19px] w-[19px] shrink-0 rounded-full border-4 border-white ${
                  i === 0 ? "bg-brand-500" : "bg-neutral-300"
                }`}
              />
              <div className="flex-1">
                <p className="text-sm font-bold">
                  {stop.time}{" "}
                  <span className="font-semibold text-neutral-600">
                    {stop.label}
                  </span>
                </p>
                {stop.location && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-neutral-500">
                    <MapPin className="h-3 w-3" /> {stop.location}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>

        {/* 담당/차량 */}
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-2xl bg-white p-4 text-sm text-neutral-500 ring-1 ring-neutral-200">
          <span className="flex items-center gap-1.5">
            <UserRound className="h-3.5 w-3.5 text-neutral-400" /> 담당:{" "}
            {schedule.manager}
          </span>
          {schedule.vehicle && (
            <span className="flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-neutral-400" />
              {schedule.vehicle}
            </span>
          )}
        </div>

        {schedule.memo && (
          <p className="mt-3 rounded-xl bg-brand-50 p-3 text-xs text-brand-700">
            {schedule.memo}
          </p>
        )}

        <p className="mt-8 text-center text-[11px] text-neutral-400">
          이 링크는 읽기 전용입니다 · 소속사가 발급한 공유 링크로 접속 중이에요
        </p>
      </div>
    </div>
  );
}
