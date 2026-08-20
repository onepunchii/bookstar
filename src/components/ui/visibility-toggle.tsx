"use client";

import { Eye, Lock, Users } from "lucide-react";
import type { FieldVisibility } from "@/lib/types";
import { cn } from "@/lib/utils";

const ORDER: FieldVisibility[] = ["public", "members", "private"];

/**
 * 민감 필드(신장·체중·생년) 행 오른쪽에 붙는 3단계 공개범위 순환 버튼.
 * 별도 설정 화면으로 빼지 않는 게 핵심 — "적으면 다 공개된다"는 공포가 입력 자체를
 * 막기 때문에, 값을 적는 그 자리에서 통제권을 보여줘야 한다.
 * 아이콘만 두면 아무도 못 읽으므로 텍스트 라벨을 항상 동반한다.
 */
export function VisibilityToggle({
  value,
  onChange,
  labels,
}: {
  value: FieldVisibility;
  onChange: (v: FieldVisibility) => void;
  labels: Record<FieldVisibility, string>;
}) {
  const next = () => onChange(ORDER[(ORDER.indexOf(value) + 1) % ORDER.length]);
  const Icon = value === "public" ? Eye : value === "members" ? Users : Lock;
  return (
    <button
      type="button"
      onClick={next}
      title={labels[value]}
      className={cn(
        "flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors",
        value === "public"
          ? "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
          : value === "members"
            ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
            : "bg-neutral-800 text-white hover:bg-neutral-700"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {labels[value]}
    </button>
  );
}
