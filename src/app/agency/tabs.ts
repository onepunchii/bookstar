// 소속사 센터 탭 정의 — 탭바와 스와이프 네비게이션이 공유.
export const AGENCY_TABS: { href: string; label: string }[] = [
  { href: "/agency", label: "대시보드" },
  { href: "/agency/today", label: "데일리" },
  { href: "/agency/inbox", label: "섭외 인박스" },
  { href: "/agency/artists", label: "아티스트" },
  { href: "/agency/schedule", label: "일정 관리" },
  { href: "/agency/settlement", label: "정산" },
  { href: "/agency/docs", label: "서류함" },
  { href: "/agency/account", label: "계정·요금제" },
  { href: "/agency/settings", label: "설정" },
];

// 현재 경로의 탭 인덱스 (하위 경로 포함)
export function activeTabIndex(pathname: string): number {
  // 정확 일치 우선(/agency), 그다음 접두 일치
  const exact = AGENCY_TABS.findIndex((t) => t.href === pathname);
  if (exact >= 0) return exact;
  // 가장 긴 접두 일치
  let best = -1;
  let bestLen = 0;
  AGENCY_TABS.forEach((t, i) => {
    if (t.href !== "/agency" && pathname.startsWith(t.href) && t.href.length > bestLen) {
      best = i;
      bestLen = t.href.length;
    }
  });
  return best;
}
