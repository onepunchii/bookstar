// 소속사 센터 탭 정의 — 탭바와 스와이프 네비게이션이 공유.
export const AGENCY_TABS: { href: string; label: string }[] = [
  { href: "/agency", label: "nav.agency.dashboard" },
  { href: "/agency/today", label: "nav.agency.today" },
  { href: "/agency/inbox", label: "agency.tab.inbox" },
  { href: "/agency/campaigns", label: "agency.tab.campaigns" },
  { href: "/agency/artists", label: "nav.agency.artists" },
  { href: "/agency/schedule", label: "agency.tab.schedule" },
  { href: "/agency/settlement", label: "nav.agency.settlement" },
  { href: "/agency/docs", label: "agency.tab.docs" },
  { href: "/agency/account", label: "agency.tab.account" },
  { href: "/agency/settings", label: "agency.tab.settings" },
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
