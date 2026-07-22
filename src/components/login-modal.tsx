"use client";

// 로그인 게이트 모달 — 액션(섭외/캠페인) 시 카카오 간편가입. 전체 페이지 리다이렉트 대신.
import { useEffect, useState } from "react";
import Link from "next/link";
import { kakaoSignIn } from "@/app/actions/auth";
import { useT } from "@/lib/i18n/client";
import { useAuthUi } from "@/lib/auth-ui-store";
import { EulaConsent } from "./eula-consent";
import { Wordmark } from "./wordmark";
import { X } from "lucide-react";

export function LoginModal() {
  const t = useT();
  const { loginOpen, loginReason, closeLogin } = useAuthUi();
  const [redirectTo, setRedirectTo] = useState("/");

  useEffect(() => {
    if (loginOpen)
      setRedirectTo(window.location.pathname + window.location.search);
  }, [loginOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeLogin();
    if (loginOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [loginOpen, closeLogin]);

  if (!loginOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={closeLogin}
    >
      <div
        className="relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeLogin}
          aria-label={t("common.close")}
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex justify-center">
          <Wordmark height={26} />
        </div>
        <h2 className="mt-5 text-lg font-black text-neutral-900">
          {loginReason ?? t("loginModal.title")}
        </h2>
        <p className="mt-1.5 text-sm text-neutral-500">
          {t("loginModal.subtitle")}
        </p>

        <form action={kakaoSignIn} className="mt-6">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          {/* EULA 동의 체크 전에는 제출 비활성 — App Store 1.2 */}
          <EulaConsent label={t("loginModal.cta")} redirectTo={redirectTo} />
        </form>

        <p className="mt-4 text-[11px] text-neutral-400">
          <Link href="/terms" target="_blank" className="underline">
            {t("common.terms")}
          </Link>{" "}
          ·{" "}
          <Link href="/privacy" target="_blank" className="underline">
            {t("common.privacy")}
          </Link>
        </p>
      </div>
    </div>
  );
}
