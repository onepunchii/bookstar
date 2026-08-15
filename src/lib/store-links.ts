// XONG 자기 앱의 스토어 URL — 이 레포의 단일 출처.
//
// 왜 패밀리 레지스트리(src/lib/familyServices.ts)에서 가져오지 않는가:
//   레지스트리의 xong 항목은 android: null 이다. 2026-08-03 시점 실측 기록으로,
//   그때는 Play 페이지가 심사 대기라 404 였다. 2026-08-15 실측에서는 200 이다.
//   레지스트리는 6개 레포에 같은 내용으로 복제되는 파일이라 이 레포에서만 고치면
//   갈라지므로, 원본(mapix)에서 되돌릴 때까지 자기 앱 URL 은 여기서 관리한다.
//   (레지스트리의 xong 항목은 xong 사이트에서 렌더되지 않는다 —
//    familyOthers(self) 가 자기 자신을 빼기 때문이다. 그래서 이 분리가 안전하다.)
//
// ★ 이 값들은 크롤러가 보는 <a href> 로 서버 렌더된다. 스토어 페이지(play.google.com·
//   apps.apple.com)는 구글 웹 검색에 색인되는 웹페이지이므로, 색인된 우리 사이트에서
//   실링크를 걸면 그 스토어 페이지의 검색 노출에 도움이 된다.
//   숨김 링크(display:none·sr-only 등)로 만들면 클로킹으로 취급되니 절대 금지.

/** App Store 앱 ID (id6790474855). */
export const APP_STORE_ID = "6790474855";
/** Play 패키지명. */
export const PLAY_PACKAGE = "kr.co.xong.app";

export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
export const PLAY_URL = `https://play.google.com/store/apps/details?id=${PLAY_PACKAGE}`;

/**
 * 유입 측정 파라미터를 붙인다. 이게 없으면 "어느 배치가 설치를 만들었나"를
 * App Store Connect·Play Console 에서 확인할 수 없다.
 *   Apple : ct=<placement>          (App Analytics 캠페인 토큰)
 *   Play  : referrer=utm_source=web&utm_medium=<placement>
 */
export function appStoreUrl(placement: string): string {
  return `${APP_STORE_URL}?ct=${placement}`;
}

export function playUrl(placement: string): string {
  const ref = encodeURIComponent(`utm_source=web&utm_medium=${placement}`);
  return `${PLAY_URL}&referrer=${ref}`;
}
