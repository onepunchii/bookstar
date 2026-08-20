// 프로필 확장 필드의 사전(dictionary)과 카테고리별 노출 규칙.
// 편집기와 공개 프로필이 같은 정의를 공유해야 "입력한 것"과 "보이는 것"이 어긋나지 않는다.
import type { Artist, ArtistCategory, EventType } from "./types";

// ── 활동 지역 — 국내 행사 섭외의 1순위 필터축 ──
export const REGIONS = [
  "서울",
  "경기",
  "인천",
  "강원",
  "대전",
  "세종",
  "충북",
  "충남",
  "광주",
  "전북",
  "전남",
  "대구",
  "경북",
  "부산",
  "울산",
  "경남",
  "제주",
  "전국",
  "해외",
] as const;

export const MAX_REGIONS = 3;

// ── 특기 — 이름만이 아니라 숙련도까지 있어야 실무 값이 된다 ──
export const SKILL_LEVELS = [
  { value: "beginner", label: "입문" },
  { value: "intermediate", label: "중급" },
  { value: "advanced", label: "상급" },
] as const;

/** 그룹별 특기 추천 — 자유 입력도 허용하되 첫 진입 마찰을 줄인다 */
export const SKILL_SUGGESTIONS: { group: string; items: string[] }[] = [
  { group: "언어·사투리", items: ["영어", "일본어", "중국어", "경상도", "전라도", "제주"] },
  { group: "음악·무용", items: ["보컬", "피아노", "기타", "드럼", "K-팝 안무", "발레", "한국무용"] },
  { group: "퍼포먼스", items: ["연기", "즉흥연기", "마술", "성대모사", "코미디", "액션"] },
  { group: "진행", items: ["행사 진행", "인터뷰", "낭독", "라이브 커머스"] },
  { group: "스포츠", items: ["수영", "축구", "농구", "골프", "테니스", "스키", "승마", "태권도"] },
  { group: "기타", items: ["요리", "필라테스", "운전(수동)", "수화"] },
];

// ── 활동 이력(크레딧) 유형 — 카테고리마다 쓰는 말이 다르다 ──
const CREDIT_TYPES_BY_CATEGORY: Partial<Record<ArtistCategory, string[]>> = {
  actor: ["영화", "드라마", "광고", "뮤직비디오", "숏폼", "연극·뮤지컬", "웹드라마"],
  idol: ["음반", "페스티벌", "콘서트", "방송", "행사", "광고", "팬미팅"],
  model: ["광고", "화보", "패션쇼", "카탈로그", "뮤직비디오", "행사"],
  mc: ["기업행사", "시상식", "축제", "방송", "컨퍼런스", "라이브 커머스"],
  influencer: ["브랜드 협업", "유튜브", "인스타그램", "틱톡", "행사", "광고"],
  speaker: ["기업 강연", "공공기관", "대학", "방송", "컨퍼런스", "북토크"],
  athlete: ["리그·경기", "국가대표", "해설", "광고", "방송", "강연"],
};
const CREDIT_TYPES_FALLBACK = ["행사", "광고", "방송", "공연", "기타"];

export function creditTypesFor(categories: ArtistCategory[]): string[] {
  const merged = categories.flatMap(
    (c) => CREDIT_TYPES_BY_CATEGORY[c] ?? []
  );
  const uniq = [...new Set(merged)];
  return uniq.length ? uniq : CREDIT_TYPES_FALLBACK;
}

/** 대표작으로 고정할 수 있는 최대 개수 — 상단에 3개까지만 */
export const MAX_HIGHLIGHTED_CREDITS = 3;

// ── 가능한 섭외 유형 ──
export const EVENT_TYPES: EventType[] = [
  "행사",
  "광고",
  "유튜브",
  "예능",
  "팬미팅",
  "축제",
  "강연",
];

// ── 외부 링크 ──
export const LINK_TYPES = [
  { value: "homepage", label: "홈페이지" },
  { value: "tiktok", label: "TikTok" },
  { value: "x", label: "X" },
  { value: "threads", label: "Threads" },
  { value: "naverBlog", label: "네이버 블로그" },
  { value: "spotify", label: "Spotify" },
  { value: "portfolio", label: "포트폴리오" },
] as const;

// ── 언어 ──
export const LANGUAGE_LEVELS = [
  { value: "native", label: "원어민" },
  { value: "business", label: "비즈니스" },
  { value: "conversational", label: "회화 가능" },
] as const;

// ── 신체 정보를 쓰는 카테고리 ──
/** 신장은 배우·모델·아이돌의 실제 검색축. MC·강연자·인플루언서에겐 노출하지 않는다. */
export const HEIGHT_CATEGORIES: ArtistCategory[] = ["actor", "model", "idol"];
/** 체중은 업계에서도 검색축이 아니라 확인용 — 배우·모델만, 기본 비공개 */
export const WEIGHT_CATEGORIES: ArtistCategory[] = ["actor", "model"];

export function usesHeight(categories: ArtistCategory[]): boolean {
  return categories.some((c) => HEIGHT_CATEGORIES.includes(c));
}
export function usesWeight(categories: ArtistCategory[]): boolean {
  return categories.some((c) => WEIGHT_CATEGORIES.includes(c));
}

// ── 공개 범위 ──
export type ViewerType = "guest" | "company" | "owner";

/**
 * 민감 필드의 공개 여부. 기본값은 필드마다 다르다 —
 * 신장은 공개, 체중은 비공개가 안전선(여성 아티스트에게 공개를 사실상 강제하는 UI는 피한다).
 */
const DEFAULT_VISIBILITY: Record<string, string> = {
  height: "public",
  weight: "private",
  birthYear: "public",
};

export function canSee(
  artist: Pick<Artist, "fieldVisibility">,
  field: string,
  viewer: ViewerType
): boolean {
  if (viewer === "owner") return true;
  const v = artist.fieldVisibility?.[field] ?? DEFAULT_VISIBILITY[field] ?? "public";
  if (v === "public") return true;
  if (v === "members") return viewer === "company";
  return false;
}

/**
 * 공개 프로필이 fetch 직후 반드시 통과시키는 리댁션 게이트.
 * 이게 없으면 비공개 체중이 HTML·RSC 페이로드에 그대로 실린다 — UX가 아니라 사고다.
 * private은 값을 지우고, members는 값을 지우되 "잠김" 표시를 위해 키만 남긴다.
 */
export function redactArtist(artist: Artist, viewer: ViewerType): Artist {
  if (viewer === "owner") return artist;
  const out: Artist = { ...artist };
  const locked: string[] = [];

  if (!canSee(artist, "height", viewer)) {
    if (out.heightCm) locked.push("height");
    out.heightCm = undefined;
  }
  if (!canSee(artist, "weight", viewer) || isMinor(artist.birthYear)) {
    if (out.weightKg) locked.push("weight");
    out.weightKg = undefined;
  }
  if (!canSee(artist, "birthYear", viewer)) {
    if (out.birthYear) locked.push("birthYear");
    out.birthYear = undefined;
  }
  // 사이즈 카드는 공개 프로필에 어떤 뷰어에게도 렌더하지 않는다(섭외 확정 후 별도 전달).
  if (out.profileExtras && "sizeCard" in out.profileExtras) {
    const { sizeCard: _drop, ...rest } = out.profileExtras as Record<string, unknown>;
    out.profileExtras = rest;
  }
  if (locked.length) {
    out.profileExtras = { ...(out.profileExtras ?? {}), _locked: locked };
  }
  return out;
}

// ── 미성년 보호 ──
/** 만 나이 계산은 연도만으로 하므로 경계값은 보수적으로(생일 전이면 한 살 적게) 본다. */
export function isMinor(birthYear?: number): boolean {
  if (!birthYear) return false;
  return new Date().getFullYear() - birthYear < 20;
}

/**
 * 미성년이면 정확한 출생년도 대신 연령대로 마스킹하고, 체중·사이즈는 아예 잠근다.
 * 안내가 아니라 시스템으로 강제해야 하는 부분.
 */
export function displayAge(birthYear?: number): string | null {
  if (!birthYear) return null;
  const age = new Date().getFullYear() - birthYear + 1; // 한국식 나이 표기 관행
  if (isMinor(birthYear)) return `${Math.floor(age / 10) * 10}대`;
  return `${birthYear}년생 · ${age}세`;
}

// ── 공개 프로필 스펙 행 조립 ──
export interface SpecRow {
  label: string;
  value: string;
}

/**
 * 값이 없는 항목은 행 자체를 만들지 않는다 —
 * 필름메이커스가 15년 써온 규칙이고, 필드를 늘릴수록 필수다(빈 프로필도 허술해 보이지 않게).
 */
export function buildSpecRows(
  artist: Artist,
  viewer: ViewerType,
  t: (k: string, p?: Record<string, string | number>) => string
): SpecRow[] {
  const rows: SpecRow[] = [];
  const cats = artist.categories?.length ? artist.categories : [artist.category];

  const age = displayAge(artist.birthYear);
  if (age && canSee(artist, "birthYear", viewer)) {
    rows.push({ label: t("profile.spec.birthYear"), value: age });
  }
  if (artist.careerStartYear) {
    const years = new Date().getFullYear() - artist.careerStartYear;
    rows.push({
      label: t("profile.spec.career"),
      value: t("profile.spec.careerValue", {
        year: artist.careerStartYear,
        n: Math.max(years, 0),
      }),
    });
  }
  if (artist.activeRegions?.length) {
    rows.push({
      label: t("profile.spec.regions"),
      value: artist.activeRegions.join(" · "),
    });
  }
  if (
    artist.heightCm &&
    usesHeight(cats) &&
    canSee(artist, "height", viewer)
  ) {
    rows.push({ label: t("profile.spec.height"), value: `${artist.heightCm} cm` });
  }
  if (
    artist.weightKg &&
    usesWeight(cats) &&
    !isMinor(artist.birthYear) &&
    canSee(artist, "weight", viewer)
  ) {
    rows.push({ label: t("profile.spec.weight"), value: `${artist.weightKg} kg` });
  }
  if (artist.languages?.length) {
    rows.push({
      label: t("profile.spec.languages"),
      value: artist.languages
        .map((l) => {
          const lv = LANGUAGE_LEVELS.find((x) => x.value === l.level);
          return lv ? `${l.lang}(${lv.label})` : l.lang;
        })
        .join(" · "),
    });
  }
  if (artist.acceptedEventTypes?.length) {
    rows.push({
      label: t("profile.spec.eventTypes"),
      value: artist.acceptedEventTypes.join(" · "),
    });
  }
  if (artist.minLeadDays) {
    rows.push({
      label: t("profile.spec.leadTime"),
      value: t("profile.spec.leadTimeValue", { n: artist.minLeadDays }),
    });
  }
  return rows;
}
