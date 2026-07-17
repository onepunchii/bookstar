"use client";

import { signIn } from "next-auth/react";
import { isNativeApp, nativePlatform } from "@/lib/native";

// 네이티브 앱 로그인 분기 — onp/mapix 검증 패턴.
// 웹/PWA: 기존 서버액션 signIn("kakao") 흐름 그대로 (이 헬퍼 안 탐).
// 네이티브 Android: 카카오톡 SDK 플러그인(1초 인증) → access_token → signIn("native").
// 네이티브 iOS: 카카오 = 웹뷰 로그인(allowNavigation *.kakao.com으로 state 쿠키 안전),
//               애플 = SIWA id_token → signIn("native") — App Store 4.8 대응.

export async function nativeKakaoLogin(callbackUrl?: string): Promise<"ok" | "cancel" | "error" | "redirect"> {
  if (nativePlatform() === "android") {
    try {
      const { KakaoLoginPlugin } = await import("capacitor-kakao-login-plugin");
      const res = await KakaoLoginPlugin.goLogin();
      const accessToken = (res as { accessToken?: string })?.accessToken;
      if (!accessToken) return "cancel";
      const r = await signIn("native", { provider: "kakao", accessToken, redirect: false });
      if (r?.error) return "error";
      window.location.href = callbackUrl || "/";
      return "ok";
    } catch {
      // 플러그인 실패 → 웹뷰 카카오 폴백
    }
  }
  // iOS·폴백: 웹뷰 안에서 OAuth 완결 (allowNavigation)
  signIn("kakao", { callbackUrl: callbackUrl || "/" });
  return "redirect";
}

export async function nativeAppleLogin(callbackUrl?: string): Promise<"ok" | "cancel" | "error"> {
  try {
    const { SocialLogin } = await import("@capgo/capacitor-social-login");
    await SocialLogin.initialize({ apple: {} });
    const res = await SocialLogin.login({ provider: "apple", options: { scopes: ["email"] } });
    const r = ((res as unknown as { result?: Record<string, unknown> })?.result ?? (res as unknown as Record<string, unknown>)) ?? {};
    const idToken = (r.idToken ?? r.identityToken) as string | undefined;
    if (!idToken) return "cancel";
    // authorization code — 서버가 refresh token으로 교환해 리보크(계정 삭제)용으로 저장
    const authorizationCode = (r.authorizationCode ?? r.code ?? "") as string;
    const out = await signIn("native", {
      provider: "apple",
      idToken,
      authorizationCode,
      redirect: false,
    });
    if (out?.error) return "error";
    window.location.href = callbackUrl || "/";
    return "ok";
  } catch {
    return "error";
  }
}

// 애플 버튼 노출 조건 — iOS 네이티브 앱에서만 (4.8)
export function showAppleLogin(): boolean {
  return isNativeApp() && nativePlatform() === "ios";
}

// 네이티브 여부 — 로그인 UI가 서버액션 대신 클라 분기를 태울지 결정
export { isNativeApp };
