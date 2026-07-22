// 서버용 정적 사전 맵 — 서버 컴포넌트는 동기적으로 사전에 접근해야 하므로 전부 정적 import.
// (클라이언트는 client.tsx가 활성 로케일 1개만 동적 import 한다.)
import type { Dict, Locale } from "../locales";
import ko from "./ko";
import en from "./en";
import ja from "./ja";
import zhTW from "./zh-TW";
import th from "./th";
import id from "./id";
import vi from "./vi";
import es from "./es";
import ptBR from "./pt-BR";
import ar from "./ar";

export const DICTS: Record<Locale, Dict> = {
  ko,
  en,
  ja,
  "zh-TW": zhTW,
  th,
  id,
  vi,
  es,
  "pt-BR": ptBR,
  ar,
};

export { ko };
