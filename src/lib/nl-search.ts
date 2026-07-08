import type { ArtistCategory } from "./types";
import { todayKST } from "@/lib/date";

// 데모 오늘: 2026-07-07 (화)
const TODAY = todayKST();

export interface ParsedQuery {
  keywords: string[];
  categories: ArtistCategory[];
  gender?: "male" | "female" | "group";
  dateRange?: { start: string; end: string; label: string };
  raw: string;
  chips: string[]; // "AI가 이해한 것" 표시용
}

const CATEGORY_KEYWORDS: Record<ArtistCategory, string[]> = {
  idol: ["아이돌", "가수"],
  actor: ["배우", "탤런트"],
  model: ["모델"],
  mc: ["mc", "엠씨", "사회자", "진행자"],
  influencer: ["인플루언서", "크리에이터", "유튜버", "인플"],
  athlete: ["스포츠", "선수", "운동선수"],
  speaker: ["강연자", "강사"],
};

const FEMALE_KEYWORDS = [
  "여자",
  "여성",
  "걸그룹",
  "여자아이돌",
  "여아이돌",
  "여자 아이돌",
];
const MALE_KEYWORDS = [
  "남자",
  "남성",
  "보이그룹",
  "남자아이돌",
  "남아이돌",
  "남자 아이돌",
];
const GROUP_KEYWORDS = ["그룹"];

function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// 주 시작(일요일) 계산
function startOfWeek(iso: string): string {
  const d = new Date(iso);
  const dow = d.getDay();
  d.setDate(d.getDate() - dow);
  return d.toISOString().slice(0, 10);
}

function endOfMonth(iso: string): string {
  const d = new Date(iso);
  const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return nextMonth.toISOString().slice(0, 10);
}

function startOfMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function parseDateRange(q: string): ParsedQuery["dateRange"] {
  const lower = q.replace(/\s+/g, "");
  if (lower.includes("다음주") || lower.includes("담주")) {
    const s = addDaysISO(startOfWeek(TODAY), 7);
    return { start: s, end: addDaysISO(s, 6), label: "다음주" };
  }
  if (lower.includes("이번주") || lower.includes("금주")) {
    const s = startOfWeek(TODAY);
    return { start: s, end: addDaysISO(s, 6), label: "이번주" };
  }
  if (lower.includes("이번달") || lower.includes("이달")) {
    return {
      start: startOfMonth(TODAY),
      end: endOfMonth(TODAY),
      label: "이번달",
    };
  }
  if (lower.includes("다음달") || lower.includes("담달")) {
    const next = new Date(TODAY);
    next.setMonth(next.getMonth() + 1);
    const iso = next.toISOString().slice(0, 10);
    return {
      start: startOfMonth(iso),
      end: endOfMonth(iso),
      label: "다음달",
    };
  }
  return undefined;
}

export function parseNL(query: string): ParsedQuery {
  const q = query.trim();
  const lower = q.toLowerCase();
  const categories: ArtistCategory[] = [];
  const chips: string[] = [];
  let gender: ParsedQuery["gender"];
  let remaining = q;

  // 카테고리 감지
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of kws) {
      if (lower.includes(kw.toLowerCase())) {
        if (!categories.includes(cat as ArtistCategory)) {
          categories.push(cat as ArtistCategory);
          chips.push(kw);
        }
        remaining = remaining.replace(new RegExp(kw, "gi"), "");
      }
    }
  }

  // 성별 감지
  for (const kw of FEMALE_KEYWORDS) {
    if (lower.includes(kw)) {
      gender = "female";
      chips.push("여성");
      remaining = remaining.replace(new RegExp(kw, "gi"), "");
      break;
    }
  }
  if (!gender) {
    for (const kw of MALE_KEYWORDS) {
      if (lower.includes(kw)) {
        gender = "male";
        chips.push("남성");
        remaining = remaining.replace(new RegExp(kw, "gi"), "");
        break;
      }
    }
  }
  if (!gender) {
    for (const kw of GROUP_KEYWORDS) {
      if (lower.includes(kw)) {
        gender = "group";
        chips.push("그룹");
        remaining = remaining.replace(new RegExp(kw, "gi"), "");
        break;
      }
    }
  }
  // 걸그룹/보이그룹은 위에서 female/male로 처리되었지만 아이돌도 함께 넣어줌
  if (
    (FEMALE_KEYWORDS.some((k) => k.includes("걸그룹")) && lower.includes("걸그룹")) ||
    (MALE_KEYWORDS.some((k) => k.includes("보이그룹")) && lower.includes("보이그룹"))
  ) {
    if (!categories.includes("idol")) {
      categories.push("idol");
      chips.push("아이돌");
    }
  }

  // 시간 감지
  const dateRange = parseDateRange(q);
  if (dateRange) {
    chips.push(`${dateRange.label} 가능`);
    remaining = remaining
      .replace(/다음주|담주|이번주|금주|이번달|이달|다음달|담달/g, "")
      .replace(/가능한?/g, "");
  }

  // 남은 텍스트에서 태그 후보 추출
  const keywords = remaining
    .split(/[\s,·]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 2 && s.length <= 8);

  return {
    keywords,
    categories,
    gender,
    dateRange,
    raw: q,
    chips,
  };
}
