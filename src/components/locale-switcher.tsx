"use client";

// 언어 선택 카드 — 내 계정(광고주)에서 표시 언어를 바꾼다.
// 선택 시 쿠키 저장 + 서버 재렌더로 앱 전체가 해당 언어(아랍어는 RTL)로 전환된다.
import { Check, Globe, Loader2 } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";

export function LocaleSwitcher({ dark = false }: { dark?: boolean }) {
  const { locale, setLocale, switching, t } = useI18n();

  return (
    <section
      className={cn(
        "rounded-[1.75rem] p-6 sm:p-7",
        dark ? "adv-card" : "border border-neutral-200 bg-white",
      )}
    >
      <div className="flex items-center gap-2">
        <Globe
          className={cn("h-4.5 w-4.5", dark ? "text-brand-400" : "text-brand-500")}
        />
        <h2
          className={cn(
            "text-base font-bold",
            dark ? "text-white" : "text-neutral-900",
          )}
        >
          {t("locale.title")}
        </h2>
        {switching && (
          <Loader2
            className={cn(
              "h-3.5 w-3.5 animate-spin",
              dark ? "text-white/40" : "text-neutral-400",
            )}
          />
        )}
      </div>
      <p className={cn("mt-1 text-sm", dark ? "text-white/45" : "text-neutral-500")}>
        {t("locale.subtitle")}
      </p>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {LOCALES.map((l) => {
          const active = l.code === locale;
          return (
            <button
              key={l.code}
              type="button"
              lang={l.code}
              dir={l.dir}
              onClick={() => setLocale(l.code as Locale)}
              aria-pressed={active}
              className={cn(
                "flex items-center justify-between gap-2 rounded-xl px-3.5 py-3 text-left text-sm font-semibold ring-1 transition-colors",
                active
                  ? dark
                    ? "bg-brand-500/15 text-white ring-brand-500"
                    : "bg-brand-50 text-brand-700 ring-brand-500"
                  : dark
                    ? "bg-white/[0.03] text-white/70 ring-white/10 hover:ring-white/25"
                    : "bg-neutral-50 text-neutral-700 ring-neutral-200 hover:ring-neutral-300",
              )}
            >
              <span className="truncate">{l.label}</span>
              {active && (
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    dark ? "text-brand-400" : "text-brand-500",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
