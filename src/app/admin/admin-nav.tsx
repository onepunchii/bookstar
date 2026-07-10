"use client";

// 관리자 탭 네비게이션 — 활성 탭 하이라이트, 가로 스크롤(모바일).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin", label: "개요" },
  { href: "/admin/users", label: "가입자" },
  { href: "/admin/agencies", label: "소속사" },
  { href: "/admin/artists", label: "아티스트" },
  { href: "/admin/bookings", label: "섭외" },
  { href: "/admin/feedback", label: "건의함" },
  { href: "/admin/errors", label: "에러" },
  { href: "/admin/outreach", label: "아웃리치" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="sticky top-14 z-20 border-b border-white/8 bg-[#0a0a0b]/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 hide-scrollbar sm:px-6">
        {TABS.map((t) => {
          const active =
            t.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={cn(
                "relative whitespace-nowrap px-3.5 py-3 text-sm font-semibold transition-colors",
                active ? "text-white" : "text-white/45 hover:text-white/75"
              )}
            >
              {t.label}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
