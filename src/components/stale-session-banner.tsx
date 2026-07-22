"use client";

// 유령 세션(삭제된 계정을 가리키는 토큰) 감지 시 상단 고정 배너 — 원클릭 재로그인.
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Loader2, RefreshCw } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function StaleSessionBanner() {
  const t = useT();
  const [busy, setBusy] = useState(false);

  const relogin = async () => {
    setBusy(true);
    try {
      await signOut({ callbackUrl: "/login" });
    } catch {
      // 폴백 — NextAuth 기본 사인아웃 페이지
      window.location.href = "/api/auth/signout";
    }
  };

  return (
    <div className="fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-3 bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black">
      {t("session.staleBanner")}
      <button
        onClick={relogin}
        disabled={busy}
        className="flex items-center gap-1.5 rounded-full bg-black px-3.5 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-85 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {t("session.reloginCta")}
      </button>
    </div>
  );
}
