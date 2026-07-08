// 오픈 캠페인 공용 옵션·표시 헬퍼.
import { todayKST } from "@/lib/date";
import { formatBudget } from "@/lib/types";

export const EVENT_TYPES = [
  "유튜브 협업",
  "브랜드 앰배서더",
  "행사 MC",
  "광고 촬영",
  "팬미팅·이벤트",
  "강연·세미나",
] as const;

// 예산 프리셋 (만원) — [min, max], null = 무제한
export const BUDGET_PRESETS: { label: string; min: number | null; max: number | null }[] = [
  { label: "~500만원", min: null, max: 500 },
  { label: "500~2천만원", min: 500, max: 2000 },
  { label: "2천~5천만원", min: 2000, max: 5000 },
  { label: "5천만원+", min: 5000, max: null },
];

export function formatBudgetRange(
  min: number | null,
  max: number | null
): string {
  if (min == null && max == null) return "예산 협의";
  if (min == null) return `~ ${formatBudget(max as number)}`;
  if (max == null) return `${formatBudget(min)} ~`;
  return `${formatBudget(min)} ~ ${formatBudget(max)}`;
}

export interface Dday {
  label: string;
  urgent: boolean;
  closed: boolean;
}

// 마감까지 D-day (KST 기준)
export function dday(deadline: string): Dday {
  const today = todayKST();
  if (deadline < today) return { label: "마감", urgent: false, closed: true };
  if (deadline === today) return { label: "오늘 마감", urgent: true, closed: false };
  const diff = Math.round(
    (new Date(`${deadline}T00:00:00`).getTime() -
      new Date(`${today}T00:00:00`).getTime()) /
      86_400_000
  );
  return { label: `D-${diff}`, urgent: diff <= 3, closed: false };
}

// 기본 마감일 = 오늘 + n일 (폼 기본값)
export function defaultDeadline(daysAhead = 7): string {
  const base = new Date(`${todayKST()}T00:00:00`);
  base.setDate(base.getDate() + daysAhead);
  return base.toISOString().slice(0, 10);
}

export const CAMPAIGN_STATUS_LABEL: Record<string, string> = {
  open: "모집 중",
  closed: "마감",
  awarded: "선정 완료",
  cancelled: "취소",
};
