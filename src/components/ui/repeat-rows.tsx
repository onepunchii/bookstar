"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 반복 구조체 공용 편집기 — 활동이력·특기·링크·언어·채널이 전부 이걸 쓴다.
 * 정렬은 ↑↓ 버튼으로만. 드래그·스와이프는 웹뷰 스크롤/SwipeNav와 싸운다.
 */
export function RepeatRows<T>({
  value,
  onChange,
  blank,
  renderRow,
  max,
  addLabel,
  emptyHint,
  reorderable,
}: {
  value: T[];
  onChange: (next: T[]) => void;
  /** 새 행의 초기값 */
  blank: () => T;
  renderRow: (row: T, update: (patch: Partial<T>) => void, index: number) => React.ReactNode;
  max?: number;
  addLabel: string;
  emptyHint?: string;
  reorderable?: boolean;
}) {
  // 빈 상태에서 버튼을 한 번 더 누르게 하면 완주율이 떨어진다 — 첫 행을 미리 깔아둔다.
  const rows = value.length ? value : [blank()];
  const commit = (next: T[]) => onChange(next);
  const update = (i: number, patch: Partial<T>) =>
    commit(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => commit(rows.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  };
  const full = max !== undefined && rows.length >= max;

  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-xl border border-neutral-200 bg-white p-3"
        >
          <div className="min-w-0 flex-1">{renderRow(row, (p) => update(i, p), i)}</div>
          <div className="flex shrink-0 items-center gap-0.5">
            {reorderable && rows.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label="위로"
                  className="flex h-8 w-7 items-center justify-center rounded-md text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === rows.length - 1}
                  aria-label="아래로"
                  className="flex h-8 w-7 items-center justify-center rounded-md text-neutral-300 hover:bg-neutral-100 hover:text-neutral-600 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="삭제"
              className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-300 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}

      {emptyHint && rows.length === 1 && (
        <p className="text-xs text-neutral-400">{emptyHint}</p>
      )}

      <button
        type="button"
        disabled={full}
        onClick={() => commit([...rows, blank()])}
        className={cn(
          "flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 text-sm font-semibold text-neutral-500 transition-colors hover:border-brand-500 hover:text-brand-600",
          full && "cursor-not-allowed opacity-40 hover:border-neutral-300 hover:text-neutral-500"
        )}
      >
        <Plus className="h-4 w-4" /> {addLabel}
        {max !== undefined && ` (${rows.length}/${max})`}
      </button>
    </div>
  );
}
