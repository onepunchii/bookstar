// Mock 날씨 — 실 데이터 붙기 전까지 규칙 기반으로 재현.
// 실 연동 시 이 함수만 갈아치우면 UI는 그대로.

const TODAY = "2026-07-07";

export type WeatherCondition = "sun" | "cloud" | "rain" | "storm" | "snow";

export interface WeatherForecast {
  date: string;
  condition: WeatherCondition;
  tempHigh: number;
  tempLow: number;
  rainProb: number; // 0~100
  tier: "observed" | "short" | "mid" | "climatology";
  tierLabel: string;
}

function seedFromString(s: string): number {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function mulberry32(seed: number) {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (new Date(b).getTime() - new Date(a).getTime()) / 86400000
  );
}

function tierFor(date: string): {
  tier: WeatherForecast["tier"];
  tierLabel: string;
} {
  const diff = daysBetween(TODAY, date);
  if (diff < 0) return { tier: "observed", tierLabel: "실측" };
  if (diff <= 3) return { tier: "short", tierLabel: "예보" };
  if (diff <= 11) return { tier: "mid", tierLabel: "중기예보" };
  return { tier: "climatology", tierLabel: "평년값" };
}

export function getForecast(
  date: string,
  location?: string
): WeatherForecast {
  const seed = seedFromString(date + (location ?? ""));
  const rand = mulberry32(seed);
  const month = Number(date.slice(5, 7));

  // 월별 기본 온도 (한국 대략)
  const baseHigh = [3, 6, 12, 19, 24, 28, 30, 31, 27, 20, 12, 5][month - 1];
  const baseLow = [-5, -3, 3, 9, 14, 19, 23, 24, 19, 11, 4, -3][month - 1];

  const tempHigh = Math.round(baseHigh + (rand() - 0.5) * 6);
  const tempLow = Math.round(baseLow + (rand() - 0.5) * 4);

  // 강수 확률: 여름 장마철엔 높게
  let rainBias = 20;
  if (month === 7 || month === 8) rainBias = 45;
  if (month === 6 || month === 9) rainBias = 30;
  const rainProb = Math.round(Math.max(0, Math.min(100, rainBias + (rand() - 0.5) * 60)));

  let condition: WeatherCondition = "sun";
  if (rainProb >= 70) condition = "storm";
  else if (rainProb >= 50) condition = "rain";
  else if (rainProb >= 30) condition = "cloud";
  else condition = "sun";
  if (month <= 2 && rainProb >= 40) condition = "snow";

  const { tier, tierLabel } = tierFor(date);

  return {
    date,
    condition,
    tempHigh,
    tempLow,
    rainProb,
    tier,
    tierLabel,
  };
}

// 강수확률 임계치 초과 시 야외 행사 리스크
export function isRainRisky(f: WeatherForecast): boolean {
  return f.rainProb >= 60;
}
