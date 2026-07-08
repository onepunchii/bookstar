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
