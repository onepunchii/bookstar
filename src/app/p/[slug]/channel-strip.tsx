import { BadgeCheck } from "lucide-react";
import type { ArtistChannel } from "@/lib/types";
import { formatFollowers } from "@/lib/types";

const PLATFORM_LABEL: Record<string, string> = {
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  naverBlog: "네이버 블로그",
  x: "X",
  threads: "Threads",
};

/**
 * 채널별 실적 — 인플루언서·아이돌.
 * 팔로워 하나만 크게 띄우지 않는다. 브랜드는 참여율·평균 조회수를 먼저 보고,
 * 팔로워는 다섯 번째로 본다. 그리고 검증되지 않은 값은 '자가 신고'로 명시한다 —
 * 이 라벨이 없으면 부풀린 수치의 책임을 플랫폼이 뒤집어쓴다.
 */
export function ChannelStrip({
  channels,
  locale,
  labels,
}: {
  channels: ArtistChannel[];
  locale: string;
  labels: { followers: string; engagement: string; selfReported: string };
}) {
  const items = channels.filter((c) => c.platform);
  if (!items.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
      {items.map((c, i) => (
        <div
          key={i}
          className="rounded-xl bg-white/[0.04] p-4 ring-1 ring-white/8"
        >
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[11px] font-semibold text-white/40">
              {PLATFORM_LABEL[c.platform] ?? c.platform}
            </p>
            {c.source === "oauth" && (
              <BadgeCheck className="h-3 w-3 shrink-0 text-brand-400" />
            )}
          </div>
          {c.handle && (
            <p className="truncate text-[11px] text-white/30">{c.handle}</p>
          )}

          {c.followers ? (
            <p className="mt-2 text-xl font-black tabular-nums text-white">
              {formatFollowers(c.followers, locale)}
            </p>
          ) : null}

          <div className="mt-1 space-y-0.5">
            {c.engagementRate ? (
              <p className="text-xs tabular-nums text-brand-400">
                {labels.engagement} {c.engagementRate}%
              </p>
            ) : null}
            {c.avgViews ? (
              <p className="text-xs tabular-nums text-white/45">
                ~{formatFollowers(c.avgViews, locale)}
              </p>
            ) : null}
          </div>

          {c.source !== "oauth" && (c.followers || c.engagementRate) ? (
            <p className="mt-2 text-[10px] text-white/25">
              {labels.selfReported}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
