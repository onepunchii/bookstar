"use client";

import { cn } from "@/lib/utils";

/**
 * 2~4칸 세그먼트 토글 — 성별·숙련도·팀구성·활동상태가 공유한다.
 * Select를 쓰지 않는 이유: 모바일 웹뷰에서 드럼 피커가 떠 탭 3회가 되고,
 * 별점을 쓰지 않는 이유: 과장 유인이 생긴다. 여기서는 탭 1회로 끝나야 한다.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  allowClear,
}: {
  options: readonly { value: T; label: string }[];
  value?: T;
  onChange: (v: T | undefined) => void;
  /** 같은 칸을 다시 누르면 선택 해제(선택 필드에 유용) */
  allowClear?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg bg-neutral-100 p-0.5">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on && allowClear ? undefined : o.value)}
            className={cn(
              "h-8 rounded-md px-3 text-sm font-medium transition-colors",
              on
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
