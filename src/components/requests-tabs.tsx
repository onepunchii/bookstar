"use client";

// 광고주 섭외 관리 탭 — 받은 섭외 / 오픈 캠페인 (다크).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/requests", label: "받은 섭외" },
  { href: "/requests/campaigns", label: "오픈 캠페인" },
];

export function RequestsTabs() {
  const pathname = usePathname();
  return (
    <div className="mt-6 flex gap-1 border-b border-white/8">
      {TABS.map((t) => {
        const active =
          t.href === "/requests"
            ? pathname === "/requests"
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "relative px-4 py-3 text-sm font-semibold transition-colors",
              active ? "text-white" : "text-white/45 hover:text-white/75"
            )}
          >
            {t.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand-500" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
