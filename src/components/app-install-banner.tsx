"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { isNativeApp } from "@/lib/native";

// 앱 설치 유도 배너 — 기기에 맞는 스토어로 보낸다.
//
// ★ 미출시 플랫폼은 null 로 둔다. 그러면 그 플랫폼에서는 배너를 아예 띄우지 않는다.
//   죽은 스토어 링크로 보내지 않기 위한 장치다.
//
// 2026-08-03 현재:
//   iOS      → App Store 출시됨(id6790474855)
//   안드로이드 → Play **심사 중**. 지금 링크를 걸면 404 페이지로 보내게 된다.
//              심사 통과하면 아래 상수만 채우면 켜진다:
//              "https://play.google.com/store/apps/details?id=kr.co.xong.app&referrer=utm_source%3Dweb%26utm_medium%3Dinstall_banner"
//
// PWA 폴백을 두지 않은 이유: xong 은 manifest 는 있으나 **서비스워커가 없어서**
// Chrome 의 beforeinstallprompt 가 발생하지 않는다. 즉 안드로이드에 제시할 수 있는
// 설치 경로가 현재 존재하지 않는다. 없는 걸 있는 척 띄우느니 안 띄우는 게 낫다.
const IOS_APP_STORE_URL: string | null =
  "https://apps.apple.com/app/id6790474855?ct=web_install_banner";
const ANDROID_PLAY_URL: string | null = null;

const DISMISS_LS = "xong-install-dismissed";
const COOLDOWN_MS = 7 * 24 * 3600 * 1000;

export default function AppInstallBanner() {
  const t = useT();
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    // 네이티브 앱 안에서는 절대 띄우지 않는다 — 이미 앱을 쓰는 사람에게 "앱을 받으세요"가 뜬다.
    if (isNativeApp()) return;

    // 홈 화면에 추가된 상태(PWA)면 이미 설치된 것으로 본다.
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return;

    // 7일 쿨다운 — 닫은 사람에게 매번 다시 띄우지 않는다.
    try {
      const last = Number(localStorage.getItem(DISMISS_LS) || 0);
      if (Date.now() - last < COOLDOWN_MS) return;
    } catch {
      /* 스토리지 차단 환경 — 쿨다운만 포기하고 계속 진행 */
    }

    const ua = navigator.userAgent;
    // iPadOS 13+ 는 데스크톱 UA 를 쓰므로 터치포인트로 보정한다.
    const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const android = /Android/i.test(ua);

    const target = ios ? IOS_APP_STORE_URL : android ? ANDROID_PLAY_URL : null;
    if (!target) return; // 데스크톱이거나, 그 플랫폼 앱이 아직 없음

    const timer = window.setTimeout(() => setUrl(target), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!url) return null;

  const dismiss = () => {
    setUrl(null);
    try {
      localStorage.setItem(DISMISS_LS, String(Date.now()));
    } catch {
      /* 무시 */
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[60] mx-auto max-w-md">
      <div className="flex items-center gap-3 rounded-2xl bg-neutral-900 px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-white">{t("install.title")}</p>
          <p className="truncate text-xs text-white/60">{t("install.subtitle")}</p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={dismiss}
          className="shrink-0 rounded-full bg-[#FF5A00] px-4 py-2 text-xs font-bold text-white transition active:scale-95"
        >
          {t("install.cta")}
        </a>
        <button
          onClick={dismiss}
          aria-label={t("common.close")}
          className="shrink-0 rounded-full p-1.5 text-white/40 transition hover:bg-white/10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
