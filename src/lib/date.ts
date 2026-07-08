// 오늘 날짜 (KST 기준 YYYY-MM-DD) — 하드코딩 TODAY 대체.
export function todayKST(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
