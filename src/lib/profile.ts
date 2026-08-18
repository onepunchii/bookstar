import type { Artist } from "./types";

// 라틴 문자 로케일 — 로케일별 표기명이 없으면 로마자(en) 표기로 폴백(한국어 이름은 못 읽으므로).
const LATIN_LOCALES = new Set(["en", "id", "vi", "es", "pt-BR"]);

// 활성 로케일에 맞는 아티스트 표기명 — 소속사 입력값 > (라틴권) 로마자 > 한국어 원본.
// 크롤러는 ko(getT botDefault:"ko")로 들어오므로 항상 한국어 이름을 색인(한국어 검색 최적화 유지).
export function resolveArtistName(
  artist: Pick<Artist, "name" | "nameLocalized">,
  locale: string
): string {
  const m = artist.nameLocalized;
  if (m?.[locale]) return m[locale];
  if (LATIN_LOCALES.has(locale) && m?.en) return m.en;
  return artist.name;
}

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
