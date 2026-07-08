"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoleStore, type Role } from "@/lib/role-store";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

const ROLES: { key: Role; label: string; home: string; initial: string }[] = [
  { key: "company", label: "광고주", home: "/", initial: "브" },
  { key: "agency", label: "소속사", home: "/agency", initial: "스" },
  { key: "artist", label: "아티스트", home: "/me", initial: "정" },
];

export function RoleSwitcher({ dark = false }: { dark?: boolean }) {
  const { role, setRole } = useRoleStore();
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
    router.push(ROLES.find((r) => r.key === next)!.home);
  };

  return (
    <div ref={ref} className="relative">
      {/* 컴팩트 pill */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="계정 전환"
        className={cn(
          "premium-ease flex h-9 items-center gap-1.5 rounded-full pl-1 pr-2.5 text-sm font-semibold",
          dark
            ? "bg-white/8 text-white hover:bg-white/12"
            : "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
          open && "opacity-0"
        )}
      >
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white",
            role === "company" ? "bg-brand-500" : "bg-neutral-900"
          )}
        >
          {current.initial}
        </span>
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5",
            dark ? "text-white/50" : "text-neutral-400"
          )}
        />
      </button>

      {/* 펼침 세그먼트 토글 */}
      {open && (
        <div
          className={cn(
            "absolute right-0 top-0 z-50 flex h-9 items-center gap-0.5 rounded-full p-1 shadow-xl duration-300 animate-in fade-in slide-in-from-right-2",
            dark
              ? "bg-black/60 shadow-black/50 ring-1 ring-white/10 backdrop-blur-xl"
              : "bg-white shadow-neutral-900/10 ring-1 ring-neutral-200"
          )}
        >
          {ROLES.map((r) => {
            const active = r.key === role;
            return (
              <button
                key={r.key}
                onClick={() => switchTo(r.key)}
                className={cn(
                  "premium-ease flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold",
                  active
                    ? "bg-brand-500 text-white"
                    : dark
                      ? "text-white/55 hover:text-white"
                      : "text-neutral-400 hover:text-neutral-900"
                )}
              >
                {active && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25 text-[9px]">
                    {r.initial}
                  </span>
                )}
                {r.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
