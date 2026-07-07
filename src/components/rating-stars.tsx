"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingStarsProps {
  value: number; // 0~5
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onChange?: (v: number) => void;
  className?: string;
}

const SIZE_CLASS = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-6 w-6",
};

export function RatingStars({
  value,
  size = "md",
  interactive = false,
  onChange,
  className,
}: RatingStarsProps) {
  return (
    <div className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const El: "button" | "span" = interactive ? "button" : "span";
        return (
          <El
            key={n}
            type={interactive ? ("button" as const) : undefined}
            onClick={interactive ? () => onChange?.(n) : undefined}
            className={cn(
              "transition-colors",
              interactive && "cursor-pointer hover:scale-110"
            )}
            aria-label={interactive ? `${n}점` : undefined}
          >
            <Star
              className={cn(
                SIZE_CLASS[size],
                filled
                  ? "fill-brand-500 text-brand-500"
                  : "fill-transparent text-neutral-300"
              )}
            />
          </El>
        );
      })}
    </div>
  );
}
