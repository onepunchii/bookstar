"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRoleStore, type Role } from "@/lib/role-store";
import { cn } from "@/lib/utils";
import { NotificationsPanel } from "./notifications-panel";
import { RoleSwitcher } from "./role-switcher";
import { SampleHint } from "./sample-hint";
import { SampleLauncher } from "./sample-launcher";
import { Wordmark } from "./wordmark";
import {
  Banknote,
  Building2,
  CalendarDays,
  CircleUserRound,
  Inbox,
  LayoutGrid,
  Palmtree,
  Search,
  ShieldAlert,
  Users,
} from "lucide-react";

const NAV_BY_ROLE: Record<
  Role,
  { href: string; label: string; icon: typeof LayoutGrid }[]
> = {
  company: [
    { href: "/", label: "홈", icon: LayoutGrid },
    { href: "/artists", label: "아티스트", icon: Search },
    // AI 추천은 홈 카드에서 진입 — 내비 중복 제거
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
  {
    initial: string;
    name: string;
    label: string;
    home: string;
    settings: string; // 프로필 수정 페이지
  }
> = {
  company: {
    initial: "브",
    name: "브라이트마케팅",
    label: "광고주 계정",
    home: "/",
    settings: "/account",
  },
  agency: {
    initial: "스",
    name: "스타원엔터테인먼트",
    label: "소속사 계정",
    home: "/agency",
    settings: "/agency/account",
  },
  artist: {
    initial: "정",
    name: "정하늘",
    label: "아티스트 계정",
    home: "/me",
    settings: "/me",
  },
};

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/agency") return pathname === "/agency";
  return pathname.startsWith(href);
}

export function AppShell({
  children,
  isAdmin = false,
}: {
  children: React.ReactNode;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();
  const { role: storedRole, setRole } = useRoleStore();

  useEffect(() => {
    useRoleStore.persist.rehydrate();
  }, []);

  // 역할은 URL이 진실 — 로그인 리다이렉트·직접 링크로 진입해도
  // 크롬(다크/라이트)·토글이 화면과 항상 일치하게 한다.
  const role: Role = pathname.startsWith("/agency")
    ? "agency"
    : pathname.startsWith("/me")
      ? "artist"
      : "company";

  useEffect(() => {
    if (storedRole !== role) setRole(role);
  }, [role, storedRole, setRole]);

  // 공개 페이지(/p/, /@, /d/, /join/, /login)와 관리자(/admin)는 앱 셸 밖 자체 레이아웃
  if (
    pathname.startsWith("/p/") ||
    pathname.startsWith("/@") ||
    pathname.startsWith("/d/") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/guide")
  ) {
    return <>{children}</>;
  }

  const nav = NAV_BY_ROLE[role];
  const account = ACCOUNT[role];

  // 광고주는 다크 럭셔리 크롬, 소속사·아티스트는 라이트
  const dark = role === "company";

  return (
    <div className={cn("flex min-h-dvh", dark && "adv-dark")}>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r md:flex",
          dark
            ? "border-white/8 bg-[#0c0c0e]"
            : "border-neutral-200 bg-white"
        )}
      >
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
                  "premium-ease flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                  dark
                    ? active
                      ? "bg-brand-500 text-white"
                      : "text-white/55 hover:bg-white/5 hover:text-white"
                    : active
                      ? "bg-neutral-900 text-white"
                      : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                )}
              >
                <item.icon
                  className={cn(
                    "h-4.5 w-4.5",
                    dark
                      ? active
                        ? "text-white"
                        : "text-white/40"
                      : active
                        ? "text-brand-400"
                        : "text-neutral-400"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div
          className={cn(
            "border-t p-4",
            dark ? "border-white/8" : "border-neutral-100"
          )}
        >
          <Link
            href={account.settings}
            aria-label="프로필 수정"
            className={cn(
              "block rounded-xl p-3 transition-colors",
              dark
                ? "bg-white/[0.04] hover:bg-white/[0.08]"
                : "bg-neutral-50 hover:bg-neutral-100"
            )}
          >
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
                <p
                  className={cn(
                    "truncate text-sm font-semibold",
                    dark && "text-white"
                  )}
                >
                  {account.name}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    dark ? "text-white/40" : "text-neutral-400"
                  )}
                >
                  {account.label} · 프로필 수정
                </p>
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col md:pl-60">
        {/* Top bar */}
        <header
          className={cn(
            "sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 backdrop-blur sm:px-6",
            dark
              ? "border-white/8 bg-[#0a0a0b]/85"
              : "border-neutral-200 bg-white/90"
          )}
        >
          <Link
            href={account.home}
            className="md:hidden"
            aria-label="xong 홈으로"
          >
            <Wordmark height={20} priority />
          </Link>
          <div
            className={cn(
              "hidden items-center gap-2 text-sm md:flex",
              dark ? "text-white/40" : "text-neutral-400"
            )}
          >
            {role === "agency" && (
              <Building2 className="h-3.5 w-3.5 text-neutral-300" />
            )}
            {nav.find((n) => isActive(pathname, n.href))?.label ?? ""}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/admin"
                aria-label="관리자"
                className={cn(
                  "flex h-9 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors",
                  dark
                    ? "bg-brand-500/15 text-brand-300 hover:bg-brand-500/25"
                    : "bg-brand-50 text-brand-600 hover:bg-brand-100"
                )}
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">관리자</span>
              </Link>
            )}
            <NotificationsPanel dark={dark} />
            <RoleSwitcher dark={dark} />
          </div>
        </header>

        <main
          className={cn(
            "relative flex-1 pb-20 md:pb-0",
            dark ? "adv-dark" : "bg-neutral-50"
          )}
        >
          {/* 공용 오렌지 앰비언트 조명 (유리 뒤) — 광고주 다크 전용 */}
          {dark && (
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 z-0 md:pl-60"
            >
              <div className="glow-orange float-orb absolute -top-16 right-[6%] h-96 w-96 rounded-full blur-2xl opacity-80" />
              <div className="glow-soft absolute left-[2%] top-[45%] h-80 w-80 rounded-full blur-2xl opacity-70" />
              <div className="glow-orange absolute bottom-[4%] right-[24%] h-80 w-80 rounded-full blur-2xl opacity-60" />
            </div>
          )}
          <div className="relative z-10">
            <SampleHint />
            {children}
          </div>
        </main>
      </div>

      {/* 샘플 시나리오 런처 (전 화면 공용) */}
      <SampleLauncher />

      {/* Mobile bottom nav — 하단 밀착 · 아이콘 전용 + 오렌지 스포트라이트 */}
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 flex items-stretch border-t md:hidden",
          dark
            ? "border-white/8 bg-[#0a0a0b]/95 backdrop-blur-xl"
            : "border-neutral-200 bg-white/95 backdrop-blur"
        )}
      >
        {nav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className="relative flex flex-1 items-center justify-center py-3.5"
            >
              {active && (
                <>
                  {/* 상단 밀착 스포트라이트 빔 */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-0 left-1/2 h-8 w-10 -translate-x-1/2 bg-gradient-to-b from-brand-500/85 via-brand-500/25 to-transparent blur-md [clip-path:polygon(40%_0,60%_0,100%_100%,0%_100%)]"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute top-0 left-1/2 h-[3px] w-7 -translate-x-1/2 rounded-full bg-brand-500 blur-[1.5px]"
                  />
                </>
              )}
              <item.icon
                className={cn(
                  "relative h-5.5 w-5.5 transition-colors",
                  active
                    ? "text-brand-500 drop-shadow-[0_0_6px_rgba(255,90,0,0.7)]"
                    : dark
                      ? "text-white/45"
                      : "text-neutral-400"
                )}
              />
            </Link>
          );
        })}
        {/* 모바일 계정(프로필 수정) — 아티스트는 /me와 중복이라 제외 */}
        {role !== "artist" && (
          <Link
            href={account.settings}
            aria-label="내 계정"
            className="relative flex flex-1 items-center justify-center py-3.5"
          >
            <CircleUserRound
              className={cn(
                "relative h-5.5 w-5.5 transition-colors",
                isActive(pathname, account.settings)
                  ? "text-brand-500 drop-shadow-[0_0_6px_rgba(255,90,0,0.7)]"
                  : dark
                    ? "text-white/45"
                    : "text-neutral-400"
              )}
            />
          </Link>
        )}
      </nav>
    </div>
  );
}
