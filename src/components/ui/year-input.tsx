"use client";

import { Input } from "./input";

/**
 * 연도 입력 — 출생년도·활동시작연도.
 * <select>로 100개 옵션을 드럼 피커에 띄우지 않는다. 대신 옆에 계산 결과를 즉시 보여줘
 * 사용자가 오타를 스스로 잡게 한다("1996" → "만 29세").
 */
export function YearInput({
  id,
  value,
  onChange,
  placeholder,
  badge,
}: {
  id: string;
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  /** 계산 결과 — "만 29세" / "활동 8년차" */
  badge?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Input
        id={id}
        inputMode="numeric"
        maxLength={4}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
          onChange(digits ? Number(digits) : undefined);
        }}
        className="w-28"
      />
      {badge && (
        <span className="shrink-0 rounded-md bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-500">
          {badge}
        </span>
      )}
    </div>
  );
}
