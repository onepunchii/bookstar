"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// 스크롤 진입 애니메이션. IntersectionObserver 기반, 한 번만 발동.
interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  delay?: number; // ms
  as?: "div" | "section" | "li" | "article";
}

export function Reveal({
  delay = 0,
  as = "div",
  className,
  children,
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Tag = as as "div";
  return (
    <Tag
      ref={ref}
      className={cn("reveal", visible && "is-visible", className)}
      style={{ ["--reveal-delay" as string]: `${delay}ms`, ...style }}
      {...props}
    >
      {children}
    </Tag>
  );
}
