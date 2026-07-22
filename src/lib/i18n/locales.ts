// XONG 다국어 — 로케일 정의 + t() 유틸 (서버·클라이언트 공용, 런타임 의존 없음).
// 광고주(수요)측만 번역 대상. 소속사·아티스트 콘솔은 한국어 유지(공급측).

export const LOCALES = [
  { code: "ko", label: "한국어", dir: "ltr" },
  { code: "en", label: "English", dir: "ltr" },
  { code: "ja", label: "日本語", dir: "ltr" },
  { code: "zh-TW", label: "繁體中文", dir: "ltr" },
  { code: "th", label: "ไทย", dir: "ltr" },
  { code: "id", label: "Bahasa Indonesia", dir: "ltr" },
  { code: "vi", label: "Tiếng Việt", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "pt-BR", label: "Português", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];
export type Dir = "ltr" | "rtl";
export type Dict = Record<string, string>;

export const DEFAULT_LOCALE: Locale = "ko";
export const COOKIE_NAME = "xong-locale";
// 쿠키 1년 유지
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

const CODES = new Set<string>(LOCALES.map((l) => l.code));

export function isLocale(v: string | null | undefined): v is Locale {
  return !!v && CODES.has(v);
}

export function dirOf(locale: Locale): Dir {
  return LOCALES.find((l) => l.code === locale)?.dir ?? "ltr";
}

// BCP-47 태그 하나(예: "zh-Hant-TW")를 지원 로케일로 매핑. 미지원이면 null.
function mapTag(tag: string): Locale | null {
  const l = tag.trim().toLowerCase();
  if (!l) return null;
  if (l.startsWith("ko")) return "ko";
  if (l.startsWith("ja")) return "ja";
  if (l.startsWith("zh")) {
    // 번체(대만·홍콩·마카오)만 지원, 간체는 미지원 → 상위 로직에서 폴백
    return /(tw|hk|mo|hant)/.test(l) ? "zh-TW" : null;
  }
  if (l.startsWith("th")) return "th";
  if (l.startsWith("id") || l.startsWith("in") || l.startsWith("ms")) return "id"; // 인니(구 코드 'in')·말레이 흡수
  if (l.startsWith("vi")) return "vi";
  if (l.startsWith("es")) return "es";
  if (l.startsWith("pt")) return "pt-BR";
  if (l.startsWith("ar")) return "ar";
  if (l.startsWith("en")) return "en";
  return null;
}

// Accept-Language 헤더(서버) 또는 navigator.languages(클라)에서 로케일 결정.
// 규칙: 신호 없음 → ko(한국 주 시장·기존 SEO 보존). 신호는 있으나 미지원 → en(국제 기본).
export function detectFromLanguages(
  tags: readonly string[] | string | null | undefined,
): Locale {
  let list: string[];
  if (!tags) return DEFAULT_LOCALE;
  if (typeof tags === "string") {
    // "ko-KR,ko;q=0.9,en;q=0.8" → ["ko-KR","ko","en"]
    list = tags
      .split(",")
      .map((p) => p.split(";")[0]?.trim())
      .filter(Boolean) as string[];
  } else {
    list = [...tags];
  }
  if (list.length === 0) return DEFAULT_LOCALE;
  for (const tag of list) {
    const m = mapTag(tag);
    if (m) return m;
  }
  // 헤더는 있으나 지원 언어 없음(예: de-DE) → 국제 기본 영어
  return "en";
}

// {name} 형태 변수 치환.
function interpolate(s: string, vars?: Record<string, string | number>): string {
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (_, k) =>
    k in vars ? String(vars[k]) : `{${k}}`,
  );
}

export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

// 활성 사전 + ko 폴백으로 t() 생성. 키 없으면 ko, ko에도 없으면 키 그대로 반환.
export function makeT(dict: Dict, fallback: Dict): TFunc {
  return (key, vars) => {
    const raw = dict[key] ?? fallback[key] ?? key;
    return interpolate(raw, vars);
  };
}
