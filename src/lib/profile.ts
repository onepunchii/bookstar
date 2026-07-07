import type { Artist } from "./types";

export interface CompletenessItem {
  label: string;
  done: boolean;
  weight: number;
}

// 프로필 완성도 — 소속사가 무엇을 채워야 노출이 늘어나는지 알려주는 지표
export function profileCompleteness(artist: Artist): {
  score: number;
  items: CompletenessItem[];
} {
  const items: CompletenessItem[] = [
    { label: "대표 사진", done: Boolean(artist.imageUrl), weight: 20 },
    { label: "한 줄 소개", done: artist.tagline.length >= 10, weight: 15 },
    { label: "태그 3개 이상", done: artist.tags.length >= 3, weight: 15 },
    {
      label: "활동 이력 2건 이상",
      done: artist.recentWork.length >= 2,
      weight: 15,
    },
    {
      label: "예산대 설정",
      done: artist.budgetRange[0] > 0,
      weight: 15,
    },
    { label: "SNS 팔로워 연동", done: artist.followers > 0, weight: 10 },
    { label: "소속사 인증", done: artist.verified, weight: 10 },
  ];
  const score = items.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0);
  return { score, items };
}
