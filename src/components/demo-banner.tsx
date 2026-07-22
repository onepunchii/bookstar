"use client";

// 둘러보기(데모) 모드 배너 — 소속사/아티스트 콘솔 상단. 샘플 데이터 안내 + 로그인 전환.
import { useRouter } from "next/navigation";
import { useAuthUi } from "@/lib/auth-ui-store";
import { useT } from "@/lib/i18n/client";
import { Eye, X } from "lucide-react";

export function DemoBanner() {
  const t = useT();
  const router = useRouter();
  const openLogin = useAuthUi((s) => s.openLogin);
  const exit = () => {
    try {
      document.cookie = "xong-demo=; path=/; max-age=0; SameSite=Lax";
    } catch {}
    router.push("/");
  };
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm ring-1 ring-brand-200">
      <Eye className="h-4 w-4 shrink-0 text-brand-600" />
      <span className="font-bold text-brand-700">{t("demoBanner.title")}</span>
      <span className="text-neutral-600">
        {t("demoBanner.desc")}
      </span>
      <div className="ml-auto flex items-center gap-1.5">
        <button
          onClick={() => openLogin(t("demoBanner.loginReason"))}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
        >
          {t("demoBanner.loginCta")}
        </button>
        <button
          onClick={exit}
          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:bg-white hover:text-neutral-700"
        >
          <X className="h-3.5 w-3.5" /> {t("demoBanner.exit")}
        </button>
      </div>
    </div>
  );
}
