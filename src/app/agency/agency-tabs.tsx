"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { AGENCY_TABS, activeTabIndex } from "./tabs";

export function AgencyTabs() {
  const pathname = usePathname();
  const t = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLAnchorElement>(null);
  const activeIdx = activeTabIndex(pathname);

  // 활성 탭을 항상 보이게 스크롤
  useEffect(() => {
    activeRef.current?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: "smooth",
    });
  }, [activeIdx]);

  // 데스크톱: 드래그로 가로 스크롤
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let down = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      down = false;
    };
    // 드래그 후 링크 클릭 방지
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("click", onClick, true);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <div
      ref={scrollRef}
      className="hide-scrollbar flex cursor-grab items-center gap-1 overflow-x-auto border-b border-neutral-200 active:cursor-grabbing"
    >
      {AGENCY_TABS.map((tab, i) => {
        const active = i === activeIdx;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            ref={active ? activeRef : undefined}
            draggable={false}
            className={cn(
              "whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors select-none",
              active
                ? "border-brand-500 text-neutral-900"
                : "border-transparent text-neutral-400 hover:text-neutral-700"
            )}
          >
            {t(tab.label)}
          </Link>
        );
      })}
    </div>
  );
}
