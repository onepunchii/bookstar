// 서버 i18n — 서버 컴포넌트/메타데이터에서 사용.
// 로케일 우선순위: xong-locale 쿠키(계정 선택) > Accept-Language(기기 언어) > ko.
// (next/headers 사용 자체가 클라이언트 import를 빌드 단계에서 막으므로 별도 server-only 가드 불필요.)
import { cookies, headers } from "next/headers";
import {
  COOKIE_NAME,
  DEFAULT_LOCALE,
  detectFromLanguages,
  dirOf,
  isLocale,
  makeT,
  type Dir,
  type Locale,
  type TFunc,
} from "./locales";
import { DICTS, ko } from "./dictionaries";

// 검색·AI 크롤러 UA 패턴 — SEO 페이지에서 canonical 언어(ko)를 안정적으로 색인시키기 위함.
// (Vercel이 Accept-Language를 주입해 봇도 en으로 감지될 수 있어, AEO 언어를 고정하는 안전장치.)
const BOT_UA_RE =
  /bot|crawl|spider|slurp|googlebot|google-extended|bingbot|duckduckbot|baiduspider|yandex|yeti|naver|daum|gptbot|oai-searchbot|chatgpt|claudebot|claude-web|anthropic|perplexity|applebot|amazonbot|ccbot|facebookexternalhit|meta-externalagent|twitterbot/i;

// opts.botDefault: 쿠키가 없고 요청이 크롤러 UA면 이 로케일로 고정(예: /about은 "ko").
// 사람 사용자는 영향 없음(쿠키·Accept-Language 그대로).
export async function getLocale(opts?: {
  botDefault?: Locale;
}): Promise<Locale> {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (isLocale(cookie)) return cookie;
  if (opts?.botDefault) {
    const ua = (await headers()).get("user-agent") ?? "";
    if (BOT_UA_RE.test(ua)) return opts.botDefault;
  }
  const accept = (await headers()).get("accept-language");
  return detectFromLanguages(accept) ?? DEFAULT_LOCALE;
}

// 서버 컴포넌트에서: const { t, locale, dir } = await getT();
export async function getT(opts?: {
  botDefault?: Locale;
}): Promise<{ locale: Locale; dir: Dir; t: TFunc }> {
  const locale = await getLocale(opts);
  return { locale, dir: dirOf(locale), t: makeT(DICTS[locale] ?? ko, ko) };
}

// 특정 로케일의 사전(레이아웃이 클라 프로바이더 초기값으로 전달).
export function dictFor(locale: Locale) {
  return DICTS[locale] ?? ko;
}
