"use client";

// 로그인 EULA 동의 게이트 — 체크 전에는 제출 버튼 비활성 (App Store 1.2:
// 무관용 약관에 대한 명시적 동의). 서버액션 폼 안에서 제출 버튼까지 렌더링한다.
// 네이티브 앱 분기(onp/mapix 패턴): Android 카카오 = SDK 1초 인증(폼 제출 대신 onClick),
// iOS = 웹뷰 카카오(폼 제출 그대로) + 애플 로그인 버튼 추가(App Store 4.8).
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/client";
import { nativePlatform } from "@/lib/native";
import { useAuthUi } from "@/lib/auth-ui-store";
import {
  nativeKakaoLogin,
  nativeAppleLogin,
  showAppleLogin,
} from "@/lib/social-login";

export function EulaConsent({
  label,
  redirectTo,
}: {
  label: string;
  redirectTo?: string;
}) {
  const t = useT();
  const router = useRouter();
  const closeLogin = useAuthUi((s) => s.closeLogin);
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  // SSR 하이드레이션 안전 — 네이티브 여부는 마운트 후에만 판단
  const [nativeAndroid, setNativeAndroid] = useState(false);
  const [appleBtn, setAppleBtn] = useState(false);
  useEffect(() => {
    setNativeAndroid(nativePlatform() === "android");
    setAppleBtn(showAppleLogin());
  }, []);

  const onNativeKakao = async () => {
    setBusy(true);
    const r = await nativeKakaoLogin(redirectTo);
    if (r === "error") alert(t("eula.kakaoLoginFail"));
    if (r !== "redirect") setBusy(false);
  };
  const onNativeApple = async () => {
    setBusy(true);
    const r = await nativeAppleLogin(redirectTo);
    if (r === "error") alert(t("eula.appleLoginFail"));
    setBusy(false);
  };

  return (
    <div className="space-y-3">
      <label className="flex cursor-pointer select-none items-start gap-2 text-left text-xs leading-relaxed text-neutral-500">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-neutral-300 accent-brand-500"
        />
        <span>
          <Link
            href="/terms"
            target="_blank"
            className="font-semibold text-neutral-700 underline"
          >
            {t("common.terms")}
          </Link>
          {t("eula.consentMid")}
          <Link
            href="/privacy"
            target="_blank"
            className="font-semibold text-neutral-700 underline"
          >
            {t("common.privacy")}
          </Link>
          {t("eula.consentTail")}
        </span>
      </label>
      <button
        // 네이티브 Android는 카카오톡 SDK 경로(onClick), 그 외엔 서버액션 폼 제출
        type={nativeAndroid ? "button" : "submit"}
        onClick={nativeAndroid ? onNativeKakao : undefined}
        disabled={!agreed || busy}
        className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] text-[15px] font-bold text-[#191600] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <KakaoIcon className="h-5 w-5" />
        {busy ? t("eula.loggingIn") : label}
      </button>
      {appleBtn && (
        <button
          type="button"
          onClick={onNativeApple}
          disabled={!agreed || busy}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-black text-[15px] font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <AppleIcon className="h-5 w-5" />
          {t("eula.appleLogin")}
        </button>
      )}
      {/* 로그인 없이 전체 기능 둘러보기 — 3역할 데모(App Store 2.1(a) 심사 접근성) */}
      <button
        type="button"
        onClick={() => {
          closeLogin();
          router.push("/?demo=1");
        }}
        className="w-full pt-1 text-center text-xs font-semibold text-neutral-400 underline underline-offset-2 transition-colors hover:text-neutral-700"
      >
        {t("eula.browseWithoutLogin")}
      </button>
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

function AppleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M16.36 12.79c.03 3.02 2.65 4.02 2.68 4.03-.02.07-.42 1.43-1.38 2.83-.83 1.22-1.7 2.43-3.06 2.45-1.34.03-1.77-.79-3.3-.79s-2.01.77-3.27.82c-1.31.05-2.32-1.31-3.16-2.52C3.16 17.13 1.84 12.6 3.6 9.6c.87-1.49 2.43-2.43 4.12-2.46 1.29-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.27-2.1 3.71M13.8 5.45c.69-.84 1.16-2 1.03-3.16-1 .04-2.2.66-2.92 1.5-.64.74-1.2 1.93-1.05 3.06 1.11.09 2.25-.57 2.94-1.4" />
    </svg>
  );
}
