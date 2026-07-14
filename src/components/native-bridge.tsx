"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { capacitorApp, isNativeApp, nativePlatform } from "@/lib/native";

// 네이티브 쉘(Capacitor) 연결 — shell-kit 표준. 웹 브라우저에선 아무것도 안 함.

// 푸시 활성화 스위치. google-services.json 배치 완료(xong-17285) + 서버 발송(push-native.ts) 완비.
// 안드로이드는 FIREBASE_SERVICE_ACCOUNT env, iOS는 APNS_* env가 있으면 실제 발송됨.
const PUSH_ENABLED = true;

export default function NativeBridge() {
  const router = useRouter();

  // 네이티브 푸시 등록 — 실패해도 앱 동작 무영향
  useEffect(() => {
    if (!isNativeApp() || !PUSH_ENABLED) return;
    (async () => {
      try {
        const push = (globalThis as { Capacitor?: { Plugins?: { PushNotifications?: {
          checkPermissions: () => Promise<{ receive: string }>;
          requestPermissions: () => Promise<{ receive: string }>;
          register: () => Promise<void>;
          addListener: (ev: string, cb: (arg: unknown) => void) => Promise<unknown>;
        } } } }).Capacitor?.Plugins?.PushNotifications;
        if (!push) return;
        let perm = await push.checkPermissions();
        if (perm.receive === "prompt") perm = await push.requestPermissions();
        if (perm.receive !== "granted") return;
        await push.addListener("registration", (t) => {
          const token = (t as { value?: string })?.value;
          if (!token) return;
          fetch("/api/push/native", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, platform: nativePlatform() ?? "android" }),
          }).catch(() => {});
        });
        await push.addListener("pushNotificationActionPerformed", (ev) => {
          const url = ((ev as { notification?: { data?: { url?: string } } })?.notification?.data)?.url;
          if (url && url.startsWith("/")) window.location.href = url;
        });
        await push.register();
      } catch {
        /* 무시 */
      }
    })();
  }, []);

  // 안드로이드 하드웨어 뒤로가기: 루트면 앱 종료, 아니면 한 단계 뒤로
  useEffect(() => {
    const app = capacitorApp();
    if (!app?.addListener) return;
    let handle: { remove?: () => void } | null = null;
    try {
      const r = app.addListener("backButton", () => {
        if (window.location.pathname === "/") app.exitApp?.();
        else router.back();
      }) as unknown;
      if (r && typeof (r as { then?: unknown }).then === "function") {
        (r as Promise<{ remove?: () => void }>).then((h) => { handle = h; }).catch(() => {});
      } else {
        handle = r as { remove?: () => void };
      }
    } catch { /* 무시 */ }
    return () => { try { handle?.remove?.(); } catch { /* 무시 */ } };
  }, [router]);

  return null;
}
