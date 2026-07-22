"use client";

// 내 계정(비로그인) 카드의 로그인 CTA — 페이지 이동 대신 로그인 모달을 연다.
// 모달에는 카카오+Apple(iOS 앱) 버튼이 함께 떠서 4.8 노출이 일관된다.
import { useAuthUi } from "@/lib/auth-ui-store";
import { useT } from "@/lib/i18n/client";
import { LogIn } from "lucide-react";

export function AccountLoginButton() {
  const t = useT();
  const openLogin = useAuthUi((s) => s.openLogin);
  return (
    <button
      onClick={() => openLogin(t("account.login.reason"))}
      className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
    >
      <LogIn className="h-4 w-4" /> {t("account.login.cta")}
    </button>
  );
}
