"use client";

// 로그인 게이트 모달 — 액션(섭외/캠페인) 시 카카오 간편가입. 전체 페이지 리다이렉트 대신.
import { useEffect, useState } from "react";
import { kakaoSignIn } from "@/app/actions/auth";
import { useAuthUi } from "@/lib/auth-ui-store";
import { Wordmark } from "./wordmark";
import { X } from "lucide-react";

export function LoginModal() {
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
          aria-label="닫기"
          className="absolute right-4 top-4 text-neutral-400 hover:text-neutral-900"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="flex justify-center">
          <Wordmark height={26} />
        </div>
        <h2 className="mt-5 text-lg font-black text-neutral-900">
          {loginReason ?? "계속하려면 로그인이 필요해요"}
        </h2>
        <p className="mt-1.5 text-sm text-neutral-500">
          카카오로 3초면 시작해요. 매칭 수수료 0%.
        </p>

        <form action={kakaoSignIn} className="mt-6">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[15px] font-bold text-[#191600] transition-opacity hover:opacity-90"
          >
            <KakaoIcon className="h-5 w-5" />
            카카오로 시작하기
          </button>
        </form>

        <p className="mt-4 text-[11px] text-neutral-400">
          로그인 시 xong 이용약관 및 개인정보처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

function KakaoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 3C6.99 3 3 6.14 3 10.01c0 2.5 1.67 4.69 4.18 5.94-.18.63-.66 2.3-.76 2.66-.12.45.16.44.35.32.15-.1 2.35-1.6 3.3-2.25.63.09 1.28.14 1.93.14 5.01 0 9-3.14 9-7.01C21 6.14 17.01 3 12 3z" />
    </svg>
  );
}
