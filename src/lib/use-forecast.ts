"use client";

// mock 즉시 표시 → 근접일(+3일)은 실 기상청(/api/weather)으로 업그레이드.
import { useEffect, useState } from "react";
import { getForecast, type WeatherForecast } from "@/lib/weather";

export function useForecast(
  date?: string,
  location?: string
): WeatherForecast | undefined {
  const [f, setF] = useState<WeatherForecast | undefined>(() =>
    date ? getForecast(date, location) : undefined
  );

  useEffect(() => {
    if (!date) {
      setF(undefined);
      return;
    }
    setF(getForecast(date, location)); // 즉시 폴백
    // 기상청 단기예보 범위(+3일) 밖이면 서버가 어차피 204 → 호출 자체를 스킵
    // (월 캘린더에서 최대 31회 낭비 호출 방지)
    const diffDays = Math.round(
      (new Date(date).getTime() -
        new Date(new Date().toISOString().slice(0, 10)).getTime()) /
        86400000
    );
    if (diffDays < 0 || diffDays > 3) return;
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

  return f;
}
