import { ARTISTS } from "./mock-data";
import { todayKST } from "@/lib/date";

// 데모 오늘: 2026-07-07
const TODAY = todayKST();
const DAYS = 30;

// id 문자열 → 결정적 시드
function seedFromId(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// Mulberry32 PRNG
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MetricSeries {
  dates: string[];
  news: number[]; // 일별 기사 카운트
  search: number[]; // 검색 트렌드 (0~100)
  followers: number[]; // 팔로워 누적 (만 단위)
}

function dateOffset(iso: string, offset: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export function generateMetrics(artistId: string): MetricSeries {
  const rand = mulberry32(seedFromId(artistId));
  const artist = ARTISTS.find((a) => a.id === artistId);
  const baseFollowers = artist ? artist.followers / 10000 : 100;
  const trendBoost = artist && artist.responseRate > 96 ? 1.2 : 1;

  const dates: string[] = [];
  const news: number[] = [];
  const search: number[] = [];
  const followers: number[] = [];

  let cumulativeGrowth = 0;
  const growthPerDay = (rand() * 0.4 - 0.1) * trendBoost; // -0.1% ~ +0.3%/day

  for (let i = 0; i < DAYS; i++) {
    const date = dateOffset(TODAY, -(DAYS - 1) + i);
    dates.push(date);

    // 뉴스: 0~6, 후반부에 spike 가끔
    const spike = i > DAYS - 10 && rand() < 0.2 * trendBoost ? rand() * 8 : 0;
    news.push(Math.round(rand() * 3 + spike));

    // 검색 트렌드: 30~90 진동
    const wave = Math.sin(i / 4 + rand() * 3) * 15;
    const drift = (i - DAYS / 2) * 0.8 * trendBoost;
    search.push(Math.max(10, Math.min(100, Math.round(50 + wave + drift))));

    // 팔로워: 완만 성장
    cumulativeGrowth += growthPerDay + rand() * 0.05;
    followers.push(Math.round(baseFollowers * (1 + cumulativeGrowth / 100)));
  }

  return { dates, news, search, followers };
}

// 최근 N일 증감률 (%)
export function recentDelta(values: number[], window = 7): number {
  if (values.length < window * 2) return 0;
  const recent = values.slice(-window).reduce((s, v) => s + v, 0);
  const prev = values
    .slice(-window * 2, -window)
    .reduce((s, v) => s + v, 0);
  if (prev === 0) return recent > 0 ? 100 : 0;
  return Math.round(((recent - prev) / prev) * 100);
}

// 최근 총합
export function recentSum(values: number[], window = 30): number {
  return values.slice(-window).reduce((s, v) => s + v, 0);
}
