"use client";

import { useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AGENCY_TABS, activeTabIndex } from "./tabs";

// 본문 좌우 스와이프 → 이전/다음 탭. 가로 스크롤 콘텐츠 위에서는 비활성(충돌 방지).
export function SwipeNav({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const start = useRef<{ x: number; y: number; ok: boolean } | null>(null);

  const isHScrollable = (target: EventTarget | null): boolean => {
    let node = target as HTMLElement | null;
    while (node && node !== document.body) {
      const style = getComputedStyle(node);
      if (
        (style.overflowX === "auto" || style.overflowX === "scroll") &&
        node.scrollWidth > node.clientWidth + 4
      ) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  };

  const onStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    start.current = {
      x: t.clientX,
      y: t.clientY,
      ok: !isHScrollable(e.target),
    };
  };

  const onEnd = (e: React.TouchEvent) => {
    const s = start.current;
    start.current = null;
    if (!s || !s.ok) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    // 명확한 가로 스와이프만 (세로 스크롤·짧은 터치 제외)
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    const idx = activeTabIndex(pathname);
    if (idx < 0) return;
    const next = dx < 0 ? idx + 1 : idx - 1; // 왼쪽으로 밀면 다음 탭
    if (next < 0 || next >= AGENCY_TABS.length) return;
    router.push(AGENCY_TABS[next].href);
  };

  return (
    <div onTouchStart={onStart} onTouchEnd={onEnd} className="min-h-[60vh]">
      {children}
    </div>
  );
}
