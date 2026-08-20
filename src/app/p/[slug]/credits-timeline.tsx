import { Sparkles } from "lucide-react";
import type { ArtistCredit } from "@/lib/types";
import { cn } from "@/lib/utils";

const VISIBLE = 6;

/**
 * 활동 이력 — 연도 내림차순 타임라인.
 * 대표작(highlighted)은 상단 고정, 6건 초과분은 <details>로 접는다(크롤러는 내부를 읽으므로 SEO 손해 없음).
 * credits가 없고 레거시 recentWork만 있으면 기존 렌더로 폴백한다 — 마이그레이션 전 프로필을 비우지 않기 위함.
 */
export function CreditsTimeline({
  credits,
  recentWork,
  moreLabel,
}: {
  credits?: ArtistCredit[];
  recentWork?: string[];
  moreLabel: string;
}) {
  if (!credits?.length) {
    if (!recentWork?.length) return null;
    return (
      <ul className="space-y-2.5">
        {recentWork.map((w, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[15px] text-white/70">
            <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-400" />
            <span style={{ wordBreak: "keep-all" }}>{w}</span>
          </li>
        ))}
      </ul>
    );
  }

  // 대표작 먼저, 그 다음 연도 내림차순(연도 없는 항목은 뒤로)
  const sorted = [...credits].sort((a, b) => {
    if (!!a.highlighted !== !!b.highlighted) return a.highlighted ? -1 : 1;
    return (b.year ?? 0) - (a.year ?? 0);
  });
  const head = sorted.slice(0, VISIBLE);
  const tail = sorted.slice(VISIBLE);

  return (
    <div className="space-y-1">
      {head.map((c, i) => (
        <CreditRow key={i} credit={c} prev={head[i - 1]} />
      ))}
      {tail.length > 0 && (
        <details className="group pt-1">
          <summary className="cursor-pointer list-none py-2 text-sm font-semibold text-brand-400 marker:content-none hover:text-brand-300">
            {moreLabel.replace("{n}", String(tail.length))}
          </summary>
          <div className="space-y-1 pt-1">
            {tail.map((c, i) => (
              <CreditRow key={i} credit={c} prev={tail[i - 1]} />
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

/** 같은 연도가 연달아 나오면 두 번째부터 연도를 감춰 시각적 그룹을 만든다 */
function CreditRow({ credit, prev }: { credit: ArtistCredit; prev?: ArtistCredit }) {
  const repeat = prev?.year === credit.year && !credit.highlighted && !prev?.highlighted;
  return (
    <div className="flex items-baseline gap-3 py-1.5">
      <span
        className={cn(
          "w-11 shrink-0 text-sm tabular-nums text-white/35",
          repeat && "opacity-0"
        )}
      >
        {credit.year ?? ""}
      </span>
      <div className="min-w-0 flex-1" style={{ wordBreak: "keep-all" }}>
        {credit.type && (
          <span className="mr-2 rounded bg-white/8 px-1.5 py-0.5 text-[11px] font-semibold text-white/50">
            {credit.type}
          </span>
        )}
        <span className="text-[15px] text-white/85">{credit.title}</span>
        {credit.role && (
          <span className="ml-1.5 text-sm text-white/45">{credit.role}</span>
        )}
        {credit.org && (
          <span className="ml-1.5 text-xs text-white/30">{credit.org}</span>
        )}
      </div>
      {credit.highlighted && (
        <span className="shrink-0 text-[10px] font-bold text-brand-400">★</span>
      )}
    </div>
  );
}
