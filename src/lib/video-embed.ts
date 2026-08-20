// 대표 영상 URL → 썸네일/임베드 정보.
// 링크만 나열하면 "진짜 사이트" 느낌이 안 난다 — 썸네일이 보여야 포트폴리오가 된다.

export interface VideoEmbed {
  kind: "youtube" | "instagram" | "tiktok" | "other";
  /** 유튜브만 무료 썸네일 CDN이 있다. 나머지는 카드 폴백. */
  thumbnail?: string;
  /** 페이지 내 재생용 임베드 주소(유튜브만) */
  embedUrl?: string;
  href: string;
}

const YT_PATTERNS = [
  /youtube\.com\/watch\?(?:.*&)?v=([\w-]{11})/,
  /youtu\.be\/([\w-]{11})/,
  /youtube\.com\/shorts\/([\w-]{11})/,
  /youtube\.com\/embed\/([\w-]{11})/,
];

export function parseVideo(rawUrl: string): VideoEmbed | null {
  const url = rawUrl.trim();
  if (!url) return null;
  const href = url.startsWith("http") ? url : `https://${url}`;

  for (const re of YT_PATTERNS) {
    const m = href.match(re);
    if (m) {
      const id = m[1];
      return {
        kind: "youtube",
        // hqdefault는 모든 영상에 존재한다(maxres는 없는 영상이 있어 깨진 이미지가 된다)
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
        href,
      };
    }
  }
  if (/instagram\.com\/(reel|p|tv)\//.test(href)) {
    return { kind: "instagram", href };
  }
  if (/tiktok\.com\//.test(href)) {
    return { kind: "tiktok", href };
  }
  return { kind: "other", href };
}
