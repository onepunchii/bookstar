"use client";

// 클라이언트 i18n — 폼·모달 등 클라 컴포넌트에서 useT()로 사용.
// 초기 로케일·사전은 서버(layout)가 주입 → 하이드레이션 불일치·깜빡임 없음.
// 언어 변경 시 활성 사전 1개만 동적 import 하고, 서버 액션으로 쿠키를 저장해
// 서버 컴포넌트까지 새 언어로 재렌더한다.
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import ko from "./dictionaries/ko";
import { setLocaleAction } from "./actions";
import {
  dirOf,
  makeT,
  type Dict,
  type Locale,
  type TFunc,
} from "./locales";

// ko는 폴백이라 정적 포함, 나머지는 동적 import.
const LOADERS: Record<Locale, () => Promise<{ default: Dict }>> = {
  ko: () => Promise.resolve({ default: ko }),
  en: () => import("./dictionaries/en"),
  ja: () => import("./dictionaries/ja"),
  "zh-TW": () => import("./dictionaries/zh-TW"),
  th: () => import("./dictionaries/th"),
  id: () => import("./dictionaries/id"),
  vi: () => import("./dictionaries/vi"),
  es: () => import("./dictionaries/es"),
  "pt-BR": () => import("./dictionaries/pt-BR"),
  ar: () => import("./dictionaries/ar"),
};

type Ctx = {
  locale: Locale;
  t: TFunc;
  setLocale: (l: Locale) => void;
  switching: boolean;
};

const I18nCtx = createContext<Ctx>({
  locale: "ko",
  t: (k) => k,
  setLocale: () => {},
  switching: false,
});

export function I18nProvider({
  initialLocale,
  initialDict,
  children,
}: {
  initialLocale: Locale;
  initialDict: Dict;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [dict, setDict] = useState<Dict>(initialDict);
  const [switching, startTransition] = useTransition();
  // 이미 로드한 사전 캐시(같은 언어로 되돌릴 때 재요청 방지)
  const cache = useRef<Partial<Record<Locale, Dict>>>({
    ko,
    [initialLocale]: initialDict,
  });

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      (async () => {
        let d = cache.current[next];
        if (!d) {
          try {
            d = (await LOADERS[next]()).default;
          } catch {
            d = {};
          }
          cache.current[next] = d;
        }
        setLocaleState(next);
        setDict(d);
        // RTL/언어 속성 즉시 반영(서버 재렌더와 별개로 화면 방향을 바로 전환)
        if (typeof document !== "undefined") {
          document.documentElement.lang = next;
          document.documentElement.dir = dirOf(next);
        }
        // 쿠키 저장 → 서버 컴포넌트 문구까지 새 언어로 재렌더
        await setLocaleAction(next);
        startTransition(() => router.refresh());
      })();
    },
    [locale, router],
  );

  const t = useMemo<TFunc>(() => makeT(dict, ko), [dict]);

  const value = useMemo<Ctx>(
    () => ({ locale, t, setLocale, switching }),
    [locale, t, setLocale, switching],
  );

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>;
}

export function useI18n(): Ctx {
  return useContext(I18nCtx);
}

// 편의 훅 — const t = useT();
export function useT(): TFunc {
  return useContext(I18nCtx).t;
}
