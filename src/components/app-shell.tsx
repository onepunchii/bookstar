"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRoleStore, type Role } from "@/lib/role-store";
import { cn } from "@/lib/utils";
import { NotificationsPanel } from "./notifications-panel";
import { SampleHint } from "./sample-hint";
import { SampleLauncher } from "./sample-launcher";
import { Wordmark } from "./wordmark";
import {
  Banknote,
  Building2,
  CalendarDays,
  Inbox,
  LayoutGrid,
  Palmtree,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

const NAV_BY_ROLE: Record<
  Role,
  { href: string; label: string; icon: typeof LayoutGrid }[]
> = {
  company: [
    { href: "/", label: "홈", icon: LayoutGrid },
    { href: "/artists", label: "아티스트", icon: Search },
    { href: "/recommend", label: "AI 추천", icon: Sparkles },
    { href: "/requests", label: "섭외 관리", icon: Inbox },
  ],
  agency: [
    { href: "/agency", label: "대시보드", icon: LayoutGrid },
    { href: "/agency/today", label: "데일리", icon: CalendarDays },
    { href: "/agency/inbox", label: "인박스", icon: Inbox },
    { href: "/agency/artists", label: "아티스트", icon: Users },
    { href: "/agency/settlement", label: "정산", icon: Banknote },
  ],
  artist: [
    { href: "/me", label: "내 일정", icon: CalendarDays },
    { href: "/me/leave", label: "휴가 신청", icon: Palmtree },
    { href: "/me/earnings", label: "내 정산", icon: Banknote },
  ],
};

const ACCOUNT: Record<
  Role,
  { initial: string; name: string; label: string; home: string }
> = {
  company: {
    initial: "브",
    name: "브라이트마케팅",
    label: "광고주 계정",
    home: "/",
  },
  agency: {
    initial: "스",
    name: "스타원엔터테인먼트",
    label: "소속사 계정",
    home: "/agency",
  },
  artist: {
    initial: "정",
    name: "정하늘",
    label: "아티스트 계정",
    home: "/me",
  },
};

const ROLE_LABELS: Record<Role, string> = {
  company: "광고주",
  agency: "소속사",
  artist: "아티스트",
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/agency") return pathname === "/agency";
  return pathname.startsWith(href);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole } = useRoleStore();

  useEffect(() => {
    useRoleStore.persist.rehydrate();
  }, []);

  // 공개 페이지(/p/, /@, /d/)는 앱 셸을 벗어난 자체 레이아웃 사용
  if (
    pathname.startsWith("/p/") ||
    pathname.startsWith("/@") ||
    pathname.startsWith("/d/")
  ) {
    return <>{children}</>;
  }

  const nav = NAV_BY_ROLE[role];
  const account = ACCOUNT[role];

  const switchRole = (next: Role) => {
    if (next === role) return;
    setRole(next);
    router.push(ACCOUNT[next].home);
  };

  // 모바일 아바타 탭: 다음 역할로 순환
  const cycleRole = () => {
    const order: Role[] = ["company", "agency", "artist"];
    switchRole(order[(order.indexOf(role) + 1) % order.length]);
  };

  return (
    <div className="flex min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-neutral-200 bg-white md:flex">
        <div className="flex h-16 items-center px-6">
          <Link href={account.home} aria-label="xong 홈으로">
            <Wordmark height={22} priority />
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4.5 w-4.5",
                    active ? "text-brand-400" : "text-neutral-400"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-neutral-100 p-4">
          <div className="rounded-xl bg-neutral-50 p-3">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
                  role === "company" ? "bg-brand-500" : "bg-neutral-900"
                )}
              >
                {account.initial}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  {account.name}
                </p>
                <p className="text-xs text-neutral-400">{account.label}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-white p-1">
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => switchRole(r)}
                  className={cn(
                    "rounded-md py-1.5 text-[11px] font-semibold transition-colors",
                    role === r
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-400 hover:text-neutral-900"
                  )}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <Link
            href={account.home}
            className="md:hidden"
            aria-label="xong 홈으로"
          >
            <Wordmark height={20} priority />
          </Link>
          <div className="hidden items-center gap-2 text-sm text-neutral-400 md:flex">
            {role === "agency" && (
              <Building2 className="h-3.5 w-3.5 text-neutral-300" />
            )}
            {nav.find((n) => isActive(pathname, n.href))?.label ?? ""}
          </div>
          <div className="flex items-center gap-2">
            <NotificationsPanel />
            <button
              onClick={cycleRole}
              aria-label="계정 전환"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white md:hidden",
                role === "company" ? "bg-brand-500" : "bg-neutral-900"
              )}
            >
              {account.initial}
            </button>
          </div>
        </header>

        <main className="flex-1 bg-neutral-50 pb-20 md:pb-0">
          <SampleHint />
          {children}
        </main>
      </div>

      {/* 샘플 시나리오 런처 (전 화면 공용) */}
      <SampleLauncher />

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-neutral-200 bg-white/95 backdrop-blur md:hidden">
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                active ? "text-brand-600" : "text-neutral-400"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
