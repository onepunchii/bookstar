import { Play } from "lucide-react";
import { parseVideo } from "@/lib/video-embed";
import type { ArtistVideo } from "@/lib/types";

/**
 * 대표 영상 — 썸네일 카드. 유튜브는 실제 썸네일을, 나머지는 플랫폼 라벨 카드를 쓴다.
 * iframe을 바로 심지 않는 이유: 영상 3개면 유튜브 플레이어 3개가 로드돼
 * 모바일에서 프로필 진입이 눈에 띄게 느려진다. 클릭하면 원본으로 보낸다.
 */
export function VideoGrid({ videos }: { videos: ArtistVideo[] }) {
  const items = videos.flatMap((v) => {
    const meta = parseVideo(v.url);
    return meta ? [{ meta, title: v.title }] : [];
  });
  if (!items.length) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((v, i) => (
        <a
          key={i}
          href={v.meta.href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="group overflow-hidden rounded-xl bg-white/[0.04] ring-1 ring-white/8 transition-colors hover:bg-white/[0.07]"
        >
          <div className="relative aspect-video overflow-hidden bg-white/[0.03]">
            {v.meta.thumbnail ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={v.meta.thumbnail}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs font-semibold uppercase tracking-wider text-white/25">
                {v.meta.kind}
              </div>
            )}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              </span>
            </span>
          </div>
          {v.title && (
            <p className="truncate px-3.5 py-2.5 text-sm text-white/75 group-hover:text-white">
              {v.title}
            </p>
          )}
        </a>
      ))}
    </div>
  );
}
