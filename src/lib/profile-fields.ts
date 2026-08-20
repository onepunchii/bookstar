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

// ── 채널 실적 ──
export const CHANNEL_PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "naverBlog", label: "네이버 블로그" },
  { value: "x", label: "X" },
  { value: "threads", label: "Threads" },
] as const;

/** 채널 실적을 입력받는 카테고리 — 인플루언서·아이돌에게만 의미가 있다 */
const CHANNEL_CATEGORIES: ArtistCategory[] = ["influencer", "idol"];
export function usesChannels(categories: ArtistCategory[]): boolean {
  return categories.some((c) => CHANNEL_CATEGORIES.includes(c));
}

// ── 카테고리별 전문 스펙 ──
// 컬럼을 늘리지 않고 profileExtras.spec.{key}에 담는다.
// 검색·필터에 연결되는 축만 나중에 정규 컬럼으로 승격한다.
export type SpecFieldUI = "text" | "number" | "chips" | "segmented";

export interface SpecFieldDef {
  key: string;
  label: string;
  ui: SpecFieldUI;
  options?: readonly string[];
  /** 공개 프로필 스펙시트에 행으로 노출할지 */
  publicRow?: boolean;
  suffix?: string;
}

const CATEGORY_SPEC: Partial<Record<ArtistCategory, SpecFieldDef[]>> = {
  idol: [
    {
      key: "genres",
      label: "장르",
      ui: "chips",
      publicRow: true,
      options: ["발라드", "댄스", "힙합", "R&B", "록", "트로트", "POP", "재즈", "국악"],
    },
    {
      key: "teamType",
      label: "팀 구성",
      ui: "segmented",
      publicRow: true,
      options: ["솔로", "듀오", "그룹"],
    },
    { key: "memberCount", label: "인원", ui: "number", publicRow: true, suffix: "명" },
    { key: "runningTimeMin", label: "공연 가능 시간", ui: "number", publicRow: true, suffix: "분" },
  ],
  mc: [
    {
      key: "hostingTypes",
      label: "진행 유형",
      ui: "chips",
      publicRow: true,
      options: ["전문MC", "아나운서", "쇼호스트", "외국어 진행", "개그맨"],
    },
    { key: "runningTimeMin", label: "진행 가능 시간", ui: "number", publicRow: true, suffix: "분" },
  ],
  speaker: [
    {
      key: "speakingFields",
      label: "강연 분야",
      ui: "chips",
      publicRow: true,
      options: ["비즈니스", "소통·스피치", "AI·IT", "경제", "건강", "인문학", "교육", "진로", "동기부여"],
    },
    { key: "speakingTopics", label: "대표 주제", ui: "text", publicRow: true },
  ],
  actor: [
    { key: "playableAgeMin", label: "연기 가능 연령 (최소)", ui: "number", suffix: "세" },
    { key: "playableAgeMax", label: "연기 가능 연령 (최대)", ui: "number", suffix: "세" },
  ],
  model: [
    { key: "playableAgeMin", label: "촬영 가능 연령 (최소)", ui: "number", suffix: "세" },
    { key: "playableAgeMax", label: "촬영 가능 연령 (최대)", ui: "number", suffix: "세" },
  ],
  athlete: [
    { key: "sport", label: "종목", ui: "text", publicRow: true },
    { key: "position", label: "포지션", ui: "text", publicRow: true },
    { key: "team", label: "소속팀", ui: "text", publicRow: true },
    {
      key: "careerStatus",
      label: "활동 상태",
      ui: "segmented",
      publicRow: true,
      options: ["현역", "은퇴"],
    },
  ],
  influencer: [
    {
      key: "contentTypes",
      label: "콘텐츠 유형",
      ui: "chips",
      publicRow: true,
      options: ["숏폼", "브이로그", "리뷰", "라이브커머스", "튜토리얼", "챌린지"],
    },
  ],
};

/** 선택된 카테고리들의 스펙 필드 — 중복 키는 첫 번째 것만(아이돌+MC의 runningTimeMin 등) */
export function specFieldsFor(
  categories: ArtistCategory[]
): { category: ArtistCategory; fields: SpecFieldDef[] }[] {
  const seen = new Set<string>();
  const out: { category: ArtistCategory; fields: SpecFieldDef[] }[] = [];
  for (const c of categories) {
    const defs = (CATEGORY_SPEC[c] ?? []).filter((f) => {
      if (seen.has(f.key)) return false;
      seen.add(f.key);
      return true;
    });
    if (defs.length) out.push({ category: c, fields: defs });
  }
  return out;
}

/** 공개 프로필 스펙시트에 붙일 카테고리 전용 행 */
export function specExtraRows(artist: Artist): SpecRow[] {
  const cats = artist.categories?.length ? artist.categories : [artist.category];
  const values = (artist.profileExtras?.spec ?? {}) as Record<string, unknown>;
  const rows: SpecRow[] = [];
  for (const { fields } of specFieldsFor(cats)) {
    for (const f of fields) {
      if (!f.publicRow) continue;
      const v = values[f.key];
      const text = Array.isArray(v) ? v.join(" · ") : v == null ? "" : String(v);
      if (!text.trim()) continue;
      rows.push({
        key: `spec.${f.key}`,
        label: f.label,
        value: f.suffix ? `${text}${f.suffix}` : text,
        wide: f.ui === "chips" || f.ui === "text",
      });
    }
  }
  return rows;
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
  key: string;
  label: string;
  value: string;
  /** 긴 값(특기·가능 섭외 등)은 2열 그리드에서 한 줄 전체를 쓴다 */
  wide?: boolean;
  /** members로 잠긴 값 — 값 대신 "로그인한 광고주에게 공개"를 렌더 */
  locked?: boolean;
}

const SKILL_LEVEL_VALUES = SKILL_LEVELS.map((l) => l.value) as readonly string[];
const LANG_LEVEL_VALUES = LANGUAGE_LEVELS.map((l) => l.value) as readonly string[];

/**
 * 사전에 없는 레벨 값이 저장돼 있어도 raw 키("profile.skillLevel.business")를
 * 화면에 뱉지 않는다 — 옛 데이터·수기 입력·스키마 변경 때 실제로 발생한다.
 */
function levelLabel(
  t: (k: string, p?: Record<string, string | number>) => string,
  ns: "skillLevel" | "langLevel",
  level: string | undefined,
  allowed: readonly string[]
): string | null {
  if (!level || !allowed.includes(level)) return null;
  return t(`profile.${ns}.${level}`);
}

/** 스펙시트를 렌더할지 판단하는 최소 행 수 — 3행짜리 표는 없는 것보다 나쁘다 */
export const MIN_SPEC_ROWS = 3;

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
  const lockedKeys = (artist.profileExtras?._locked as string[] | undefined) ?? [];

  const age = displayAge(artist.birthYear);
  if (age) {
    rows.push({ key: "birthYear", label: t("profile.spec.birthYear"), value: age });
  } else if (lockedKeys.includes("birthYear")) {
    rows.push({ key: "birthYear", label: t("profile.spec.birthYear"), value: "", locked: true });
  }

  if (artist.gender) {
    rows.push({
      key: "gender",
      label: t("profile.spec.gender"),
      value: t(`profile.gender.${artist.gender}`),
    });
  }

  if (artist.careerStartYear) {
    const years = new Date().getFullYear() - artist.careerStartYear;
    rows.push({
      key: "career",
      label: t("profile.spec.career"),
      value: t("profile.spec.careerValue", {
        year: artist.careerStartYear,
        n: Math.max(years, 0),
      }),
    });
  }

  if (artist.activeRegions?.length) {
    rows.push({
      key: "regions",
      label: t("profile.spec.regions"),
      value: artist.activeRegions.join(" · "),
    });
  }

  if (usesHeight(cats)) {
    if (artist.heightCm) {
      rows.push({ key: "height", label: t("profile.spec.height"), value: `${artist.heightCm} cm` });
    } else if (lockedKeys.includes("height")) {
      rows.push({ key: "height", label: t("profile.spec.height"), value: "", locked: true });
    }
  }
  if (usesWeight(cats)) {
    if (artist.weightKg) {
      rows.push({ key: "weight", label: t("profile.spec.weight"), value: `${artist.weightKg} kg` });
    } else if (lockedKeys.includes("weight")) {
      rows.push({ key: "weight", label: t("profile.spec.weight"), value: "", locked: true });
    }
  }

  if (artist.languages?.length) {
    rows.push({
      key: "languages",
      label: t("profile.spec.languages"),
      value: artist.languages
        .map((l) => {
          const lv = levelLabel(t, "langLevel", l.level, LANG_LEVEL_VALUES);
          return lv ? `${l.lang}(${lv})` : l.lang;
        })
        .join(" · "),
    });
  }

  if (artist.skills?.length) {
    rows.push({
      key: "skills",
      label: t("profile.spec.skills"),
      wide: true,
      value: artist.skills
        .map((s) => {
          const lv = levelLabel(t, "skillLevel", s.level, SKILL_LEVEL_VALUES);
          return lv ? `${s.name}(${lv})` : s.name;
        })
        .join(" · "),
    });
  }

  if (artist.acceptedEventTypes?.length) {
    rows.push({
      key: "eventTypes",
      label: t("profile.spec.eventTypes"),
      wide: true,
      value: artist.acceptedEventTypes.join(" · "),
    });
  }

  if (artist.minLeadDays) {
    rows.push({
      key: "leadTime",
      label: t("profile.spec.leadTime"),
      value: t("profile.spec.leadTimeValue", { n: artist.minLeadDays }),
    });
  }

  return rows;
}
