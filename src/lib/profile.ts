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
  /** i18n 키 접미사 — 화면에서 t(`agency.completeness.${key}`)로 렌더 */
  key: string;
  done: boolean;
  weight: number;
  /** 이 항목을 채우러 갈 블록 id */
  block: string;
}

/**
 * 프로필 완성도 — 소속사가 무엇을 채워야 노출이 늘어나는지 알려주는 지표.
 *
 * 항목은 7개 카테고리 전부에 동일해야 한다. 카테고리 전용 필드나 신체 필드를 넣으면
 * 카테고리를 하나 더 고르는 순간 점수가 떨어져 카테고리 추가를 억제하는 역인센티브가
 * 되고, 민감 정보를 게이지로 압박하게 된다.
 */
export function profileCompleteness(artist: Artist): {
  score: number;
  items: CompletenessItem[];
} {
  const workCount = (artist.credits?.length ?? 0) + artist.recentWork.length;
  const items: CompletenessItem[] = [
    { key: "photo", done: Boolean(artist.imageUrl), weight: 20, block: "head" },
    { key: "tagline", done: artist.tagline.length >= 10, weight: 10, block: "head" },
    { key: "category", done: artist.categories.length > 0, weight: 10, block: "identity" },
    { key: "regions", done: (artist.activeRegions?.length ?? 0) > 0, weight: 10, block: "booking" },
    { key: "budget", done: artist.budgetRange[0] > 0, weight: 10, block: "booking" },
    { key: "eventTypes", done: (artist.acceptedEventTypes?.length ?? 0) > 0, weight: 5, block: "booking" },
    { key: "credits", done: workCount >= 2, weight: 15, block: "career" },
    { key: "bio", done: Boolean(artist.bio && artist.bio.length >= 30), weight: 10, block: "career" },
    { key: "skills", done: (artist.skills?.length ?? 0) >= 3, weight: 10, block: "career" },
  ];
  const score = items.reduce((sum, i) => sum + (i.done ? i.weight : 0), 0);
  return { score, items };
}
