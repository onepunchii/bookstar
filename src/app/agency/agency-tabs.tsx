"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/agency", label: "대시보드" },
  { href: "/agency/today", label: "데일리" },
  { href: "/agency/inbox", label: "섭외 인박스" },
  { href: "/agency/artists", label: "아티스트" },
  { href: "/agency/schedule", label: "일정 관리" },
  { href: "/agency/settlement", label: "정산" },
  { href: "/agency/docs", label: "서류함" },
  { href: "/agency/settings", label: "설정" },
];

export function AgencyTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200">
      {TABS.map((tab) => {
        const active =
          tab.href === "/agency"
            ? pathname === "/agency"
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
              active
                ? "border-brand-500 text-neutral-900"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
