"use client";

import { Check, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * 편집기의 접이식 블록.
 * 필드가 30개여도 부담스럽지 않게 하는 핵심은 "한 화면에 동시에 보이는 빈 칸의 개수"를
 * 줄이는 것이다 — 채운 블록은 한 줄 요약으로 접히고, 비어 있는 블록도 한 줄만 차지한다.
 * 접힌 요약에 실제 값이 들어가므로 Ctrl+F로도 찾을 수 있다.
 */
export function FieldBlock({
  title,
  hint,
  summary,
  done,
  open,
  onToggle,
  muted,
  children,
}: {
  title: string;
  /** 펼쳤을 때 부제 — 이 항목이 어디에 쓰이는지 */
  hint?: string;
  /** 접혔을 때 부제 — 실제 입력값 요약 */
  summary?: string;
  done?: boolean;
  open: boolean;
  onToggle: () => void;
  /** 해당 없는 카테고리 등 — 흐리게 */
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("overflow-hidden", muted && "opacity-60")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className="flex w-full items-center gap-3 p-5 text-left"
      >
        <span
          className={cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-colors",
            done ? "bg-brand-500 text-white" : "bg-neutral-100 text-neutral-300"
          )}
        >
          <Check className="h-3 w-3" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">{title}</span>
          <span className="block truncate text-xs text-neutral-400">
            {open ? hint : summary || hint}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-neutral-400 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="space-y-4 border-t border-neutral-100 p-5 pt-4">
          {children}
        </div>
      )}
    </Card>
  );
}
