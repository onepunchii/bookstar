import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// 프리미엄 CTA — pill + 원형 아이콘 래퍼 + 호버 물리
interface PremiumCTAProps {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "dark" | "ghost";
  size?: "md" | "lg";
  className?: string;
}

export function PremiumCTA({
  href,
  children,
  variant = "solid",
  size = "lg",
  className,
}: PremiumCTAProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group premium-ease inline-flex items-center gap-3 rounded-full font-semibold",
        "hover:scale-[1.02] active:scale-[0.98]",
        size === "lg" ? "py-3 pl-7 pr-3 text-base" : "py-2.5 pl-5 pr-2.5 text-sm",
        variant === "solid" &&
          "bg-brand-500 text-white hover:bg-brand-600 hover:brand-glow",
        variant === "dark" && "bg-neutral-950 text-white hover:bg-neutral-800",
        variant === "ghost" &&
          "bg-white text-neutral-900 ring-1 ring-neutral-200 hover:ring-neutral-900",
        className
      )}
    >
      {children}
      <span
        className={cn(
          "premium-ease flex items-center justify-center rounded-full",
          size === "lg" ? "h-8 w-8" : "h-7 w-7",
          variant === "solid" && "bg-white/20",
          variant === "dark" && "bg-white/15",
          variant === "ghost" && "bg-neutral-900/5"
        )}
      >
        <ArrowRight className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
