import { fetchYoutubeVideos } from "@/lib/youtube";
import { cn } from "@/lib/utils";
import { Play } from "lucide-react";

// 아티스트 유튜브 채널의 최근 영상 — 카드형 가로 스크롤.
// 채널 미연동·조회 실패 시 아무것도 렌더하지 않음.
export async function YoutubeVideos({
  channel,
  dark = false,
}: {
  channel: string;
  dark?: boolean;
}) {
  const videos = await fetchYoutubeVideos(channel, 8);
  if (videos.length === 0) return null;

  return (
    <div className="hide-scrollbar -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-2">
      {videos.map((v) => (
        <a
          key={v.id}
          href={`https://www.youtube.com/watch?v=${v.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "group w-56 shrink-0 snap-start overflow-hidden rounded-2xl",
            dark
              ? "adv-card adv-card-hover"
              : "bg-white shadow-sm ring-1 ring-neutral-200/70"
          )}
        >
          <div className="relative aspect-video overflow-hidden bg-neutral-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={v.thumbnail}
              alt={v.title}
              loading="lazy"
              className="premium-ease h-full w-full object-cover group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/55 opacity-0 backdrop-blur transition-opacity group-hover:opacity-100">
                <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
              </span>
            </span>
          </div>
          <p
            className={cn(
              "line-clamp-2 px-3 py-2.5 text-xs font-semibold leading-snug",
              dark ? "text-white/80" : "text-neutral-800"
            )}
          >
            {v.title}
          </p>
        </a>
      ))}
    </div>
  );
}
