import { Lock } from "lucide-react";
import type { SpecRow } from "@/lib/profile-fields";
import { cn } from "@/lib/utils";

/**
 * 공개 프로필 스펙시트 — 라벨:값 헤어라인 격자.
 * 값이 없는 항목은 buildSpecRows가 애초에 배열에 넣지 않는다("-"·"정보 없음"을 렌더하지 않기 위함).
 * gap-px + 자식 배경으로 1px 구분선을 만든다(border 중첩 없이 깔끔한 격자).
 */
export function SpecList({
  rows,
  lockedLabel,
}: {
  rows: SpecRow[];
  lockedLabel: string;
}) {
  if (!rows.length) return null;
  return (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-2">
      {rows.map((r) => (
        <div
          key={r.key}
          className={cn(
            "flex items-baseline gap-3 bg-[#0a0a0b] px-4 py-3.5",
            r.wide && "sm:col-span-2"
          )}
        >
          <dt className="w-20 shrink-0 text-xs font-semibold text-white/40">
            {r.label}
          </dt>
          <dd
            className="min-w-0 flex-1 text-[15px] text-white/85"
            style={{ wordBreak: "keep-all" }}
          >
            {r.locked ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-white/35">
                <Lock className="h-3.5 w-3.5" />
                {lockedLabel}
              </span>
            ) : (
              <span className="tabular-nums">{r.value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
