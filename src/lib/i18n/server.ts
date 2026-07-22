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

export async function getLocale(): Promise<Locale> {
  const cookie = (await cookies()).get(COOKIE_NAME)?.value;
  if (isLocale(cookie)) return cookie;
  const accept = (await headers()).get("accept-language");
  return detectFromLanguages(accept) ?? DEFAULT_LOCALE;
}

// 서버 컴포넌트에서: const { t, locale, dir } = await getT();
export async function getT(): Promise<{ locale: Locale; dir: Dir; t: TFunc }> {
  const locale = await getLocale();
  return { locale, dir: dirOf(locale), t: makeT(DICTS[locale] ?? ko, ko) };
}

// 특정 로케일의 사전(레이아웃이 클라 프로바이더 초기값으로 전달).
export function dictFor(locale: Locale) {
  return DICTS[locale] ?? ko;
}
