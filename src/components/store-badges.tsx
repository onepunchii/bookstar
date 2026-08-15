"use client";

// 스토어 링크 배지 — App Store · Google Play 로 가는 **실링크**.
//
// ★ 서버에서 그대로 렌더된다("use client" 여도 SSR 은 된다). 크롤러가 이 <a href> 를 본다.
//   기존 패밀리 카드(family-services.tsx)는 기기 감지로 링크를 갈아 끼워서 서버 HTML 에
//   스토어 링크가 남지 않았다. 이 컴포넌트는 그 병행 보완책이다 — 두 링크를 항상 함께
//   내보내므로 봇도 사람도 같은 HTML 을 받는다.
//
// ⛔ 숨김(display:none·visibility:hidden·sr-only·0px·화면 밖 배치)으로 링크를 심지 않는다.
//    클로킹으로 취급돼 역효과다. 사용자에게도 실제로 보이는 링크여야 한다.
//
// 라벨은 스토어 고유명사(App Store · Google Play)뿐이라 번역 대상이 아니다 —
// 10개 언어 사전에 같은 문자열을 복제하지 않는다. 이미지·로고도 쓰지 않는다
// (family-services.tsx 와 같은 이유: 글자 박힌 이미지는 크롤러가 읽지 못한다).
//
// 네이티브 앱 안에서만 숨긴다:
//   · 이미 앱을 쓰는 사람에게 "앱 받기"는 무의미하고,
//   · 애플 심사 지침(2.3.10)이 앱 안에서 다른 모바일 플랫폼(Google Play)을
//     언급하는 것을 막는다.
//   이건 검색엔진을 상대로 한 숨김이 아니다 — 웹 브라우저 사용자와 크롤러는
//   똑같은 HTML 을 받고, Capacitor WebView 안에서만 사라진다.
import { useEffect, useState } from "react";
import { isNativeApp } from "@/lib/native";
import { appStoreUrl, playUrl } from "@/lib/store-links";
import { cn } from "@/lib/utils";

export function StoreBadges({
  placement,
  size = "sm",
}: {
  /** 유입 측정 토큰(예: "web_footer", "app_landing"). */
  placement: string;
  size?: "sm" | "lg";
}) {
  const [native, setNative] = useState(false);

  useEffect(() => {
    setNative(isNativeApp());
  }, []);

  if (native) return null;

  const base = cn(
    // text-start: 아랍어(RTL)에서도 정렬이 함께 뒤집히도록 논리 속성 사용
    "inline-flex items-center rounded-full text-start font-black transition-colors",
    size === "lg" ? "px-6 py-3.5 text-sm" : "px-4 py-2.5 text-[13px]",
  );

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <a
        href={appStoreUrl(placement)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(base, "bg-white text-neutral-900 hover:bg-white/90")}
      >
        App Store
      </a>
      <a
        href={playUrl(placement)}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          base,
          "bg-white/8 text-white ring-1 ring-white/15 hover:bg-white/12",
        )}
      >
        Google Play
      </a>
    </div>
  );
}
