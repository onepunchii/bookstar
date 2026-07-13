import type { CapacitorConfig } from "@capacitor/cli";

// XONG 네이티브 쉘 — mapix 표준(원격 URL 모드, shell-kit 생성).
// 웹뷰가 프로덕션을 직접 로드 → 앱 내용은 git push 배포만으로 갱신, 스토어 재심사 불필요.
const config: CapacitorConfig = {
  appId: "kr.co.xong.app",
  appName: "XONG",
  webDir: "native-shell",
  server: {
    url: "https://www.xong.co.kr",
    androidScheme: "https",
    // 카카오 로그인은 웹뷰 안에서 완결되어야 state 쿠키가 유지됨 (onp 검증 패턴)
    allowNavigation: ["*.kakao.com"],
  },
  ios: {
    contentInset: "never", // safe-area는 웹 CSS의 env(safe-area-inset-*)가 직접 처리
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
