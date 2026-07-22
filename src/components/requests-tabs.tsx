"use client";

// 광고주 섭외 관리 탭 — 받은 섭외 / 오픈 캠페인(부각 필 버튼) (다크).
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Megaphone } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function RequestsTabs() {
  const t = useT();
  const pathname = usePathname();
  const onCampaigns = pathname.startsWith("/requests/campaigns");

  return (
    <div className="mt-6 flex items-center gap-2 border-b border-white/8 pb-3">
      <Link
        href="/requests"
        className={cn(
          "premium-ease rounded-full px-4 py-2 text-sm font-semibold",
          !onCampaigns
            ? "bg-white text-neutral-900"
            : "text-white/50 ring-1 ring-white/10 hover:text-white"
        )}
      >
        {t("requests.tabs.received")}
      </Link>
      {/* 오픈 캠페인 — 신규 기능 부각 필 */}
      <Link
        href="/requests/campaigns"
        className={cn(
          "premium-ease flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold",
          onCampaigns
            ? "bg-brand-500 text-white shadow-[0_0_16px_rgba(255,90,0,0.35)]"
            : "bg-brand-500/12 text-brand-300 ring-1 ring-brand-500/40 hover:bg-brand-500/20 hover:text-brand-200"
        )}
      >
        <Megaphone className="h-3.5 w-3.5" />
        {t("requests.tabs.openCampaigns")}
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[9px] font-black leading-none",
            onCampaigns ? "bg-white/25 text-white" : "bg-brand-500 text-white"
          )}
        >
          NEW
        </span>
      </Link>
    </div>
  );
}
