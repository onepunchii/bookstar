"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoleStore, type Role } from "@/lib/role-store";
import { useAuthUi } from "@/lib/auth-ui-store";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { Check, ChevronDown } from "lucide-react";

const ROLES: { key: Role; label: string; home: string; desc: string }[] = [
  { key: "company", label: "roleSwitcher.company.label", home: "/", desc: "roleSwitcher.company.desc" },
  { key: "agency", label: "roleSwitcher.agency.label", home: "/agency", desc: "roleSwitcher.agency.desc" },
  { key: "artist", label: "roleSwitcher.artist.label", home: "/me", desc: "roleSwitcher.artist.desc" },
];

export function RoleSwitcher({
  dark = false,
  agencyCapability = "none",
}: {
  dark?: boolean;
  agencyCapability?: string;
}) {
  const t = useT();
  const { role, setRole } = useRoleStore();
  const isLoggedIn = useAuthUi((s) => s.isLoggedIn);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = ROLES.find((r) => r.key === role) ?? ROLES[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const switchTo = (next: Role) => {
    setOpen(false);
    if (next === role) return;
    setRole(next);
    const home = ROLES.find((r) => r.key === next)!.home;

    // 비로그인(게스트) — 로그인·모달 없이 데모 쿠키로 소속사/아티스트 콘솔 바로 열람.
    // (쓰기 API는 여전히 로그인 필수. 로그인은 계정 아이콘/데모 배너에서 가능.)
    if (!isLoggedIn) {
      try {
        document.cookie = "xong-demo=1; path=/; max-age=86400; SameSite=Lax";
      } catch {}
      router.push(home as never);
      return;
    }

    // 로그인 사용자 — 소속사 전환은 인증 자격에 따라 분기
    // 인증됨/심사중 → 콘솔 바로, 미신청·반려 → 인증 셋업
    if (
      next === "agency" &&
      (agencyCapability === "none" || agencyCapability === "rejected")
    ) {
      router.push("/agency/verify");
      return;
    }
    router.push(home as never);
  };

  return (
    <div ref={ref} className="relative">
      {/* 컴팩트 pill — 역할명 항상 표시 (모바일 포함) */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={t("roleSwitcher.accountSwitch")}
        aria-expanded={open}
        className={cn(
          "premium-ease flex h-9 items-center gap-2 rounded-full px-3.5 text-[13px] font-bold",
          dark
            ? "bg-white/8 text-white ring-1 ring-white/10 hover:bg-white/12"
            : "bg-neutral-100 text-neutral-900 ring-1 ring-neutral-200/60 hover:bg-neutral-200"
        )}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500 shadow-[0_0_6px_rgba(255,90,0,0.7)]" />
        {t(current.label)}
        <ChevronDown
          className={cn(
            "premium-ease h-3.5 w-3.5",
            open && "rotate-180",
            dark ? "text-white/50" : "text-neutral-400"
          )}
        />
      </button>

      {/* 드롭다운 — 역할 카드 */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-11 z-50 w-48 rounded-2xl p-1.5 shadow-2xl duration-200 animate-in fade-in slide-in-from-top-1",
            dark
              ? "bg-[#151517]/95 shadow-black/60 ring-1 ring-white/10 backdrop-blur-xl"
              : "bg-white shadow-neutral-900/15 ring-1 ring-neutral-200"
          )}
        >
          {ROLES.map((r) => {
            const active = r.key === role;
            return (
              <button
                key={r.key}
                onClick={() => switchTo(r.key)}
                className={cn(
                  "premium-ease flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left",
                  active
                    ? dark
                      ? "bg-brand-500/15"
                      : "bg-brand-50"
                    : dark
                      ? "hover:bg-white/5"
                      : "hover:bg-neutral-50"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-sm font-bold",
                      active
                        ? "text-brand-500"
                        : dark
                          ? "text-white"
                          : "text-neutral-900"
                    )}
                  >
                    {t(r.label)}
                  </p>
                  <p
                    className={cn(
                      "text-[11px]",
                      dark ? "text-white/40" : "text-neutral-400"
                    )}
                  >
                    {t(r.desc)}
                  </p>
                </div>
                {active && <Check className="h-4 w-4 shrink-0 text-brand-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
