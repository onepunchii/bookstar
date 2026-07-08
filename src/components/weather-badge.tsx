"use client";

import { useEffect, useState } from "react";
import {
  getForecast,
  type WeatherCondition,
  type WeatherForecast,
} from "@/lib/weather";
import { cn } from "@/lib/utils";
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Zap,
} from "lucide-react";

const ICON_BY_CONDITION: Record<WeatherCondition, typeof Sun> = {
  sun: Sun,
  cloud: Cloud,
  rain: CloudRain,
  storm: Zap,
  snow: CloudSnow,
};

interface WeatherBadgeProps {
  date: string;
  location?: string;
  compact?: boolean;
  className?: string;
}

export function WeatherBadge({
  date,
  location,
  compact = false,
  className,
}: WeatherBadgeProps) {
  // mock을 즉시 표시(폴백) → 근접일이면 실 기상청 데이터로 업그레이드
  const [f, setF] = useState<WeatherForecast>(() => getForecast(date, location));

  useEffect(() => {
    let alive = true;
    const params = new URLSearchParams({ date });
    if (location) params.set("location", location);
    fetch(`/api/weather?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: WeatherForecast | null) => {
        if (alive && data) setF(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [date, location]);

  const Icon = ICON_BY_CONDITION[f.condition];
  const risky = f.rainProb >= 60;

  if (compact) {
    return (
      <span
        title={`${f.tierLabel} · ${f.tempHigh}° / ${f.tempLow}° · 강수확률 ${f.rainProb}%`}
        className={cn(
          "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 text-[10px] font-semibold",
          risky
            ? "bg-brand-500 text-white"
            : "bg-neutral-100 text-neutral-600",
          className
        )}
      >
        <Icon className="h-2.5 w-2.5" />
        {f.tempHigh}°
      </span>
    );
  }

  return (
    <span
      title={`${f.tierLabel}`}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        risky
          ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
          : "bg-neutral-100 text-neutral-600",
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {f.tempHigh}°/{f.tempLow}° · 비 {f.rainProb}%
      <span className="rounded px-1 text-[9px] font-bold text-neutral-500">
        {f.tierLabel}
      </span>
    </span>
  );
}
