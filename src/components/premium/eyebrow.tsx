import { cn } from "@/lib/utils";

// 섹션 헤딩 위 마이크로 라벨
export function Eyebrow({
  children,
  tone = "brand",
  className,
}: {
  children: React.ReactNode;
  tone?: "brand" | "muted" | "light";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "eyebrow inline-flex items-center gap-1.5",
        tone === "brand" && "text-brand-600",
        tone === "muted" && "text-neutral-400",
        tone === "light" && "text-white/50",
        className
      )}
    >
      <span
        className={cn(
          "h-px w-6",
          tone === "brand" && "bg-brand-500",
          tone === "muted" && "bg-neutral-300",
          tone === "light" && "bg-white/40"
        )}
      />
      {children}
    </span>
  );
}
