"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 다중 선택 칩 — 활동지역·가능 섭외유형·장르·진행유형 등이 공유한다.
 * 기존 카테고리 칩과 같은 시각 언어(선택 시 brand-500 채움 + 체크).
 * max에 도달하면 미선택 칩을 눌러도 반응하지 않게 해서 "왜 안 되지"를 없앤다.
 */
export function ChipMulti({
  options,
  value,
  onChange,
  max,
  labelOf,
}: {
  options: readonly string[];
  value: string[];
  onChange: (next: string[]) => void;
  max?: number;
  labelOf?: (v: string) => string;
}) {
  const full = max !== undefined && value.length >= max;
  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else if (!full) onChange([...value, v]);
  };
  return (
    <div>
      {max !== undefined && (
        <p className="mb-2 text-xs tabular-nums text-neutral-400">
          {value.length}/{max}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = value.includes(o);
          const locked = full && !on;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              disabled={locked}
              onClick={() => toggle(o)}
              className={cn(
                "flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                on
                  ? "bg-brand-500 text-white"
                  : "border border-neutral-200 text-neutral-600 hover:border-brand-500",
                locked && "cursor-not-allowed opacity-40 hover:border-neutral-200"
              )}
            >
              {on && <Check className="h-3 w-3" />}
              {labelOf ? labelOf(o) : o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
