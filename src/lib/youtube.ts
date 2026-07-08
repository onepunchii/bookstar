// YouTube Data API v3 — 서버 전용. 채널 구독자 수 실측.
// 입력: @핸들 / 채널 URL / UC 채널ID. 실패·키없음이면 null → 저장된 값 폴백.

function parseChannel(input: string): { forHandle?: string; id?: string } | null {
  const s = input.trim();
  if (!s) return null;
  // UC로 시작하는 채널 ID
  if (/^UC[\w-]{20,}$/.test(s)) return { id: s };
  // URL 형태
  const handleMatch = s.match(/@([A-Za-z0-9._-]+)/);
  if (handleMatch) return { forHandle: `@${handleMatch[1]}` };
  const chMatch = s.match(/\/channel\/(UC[\w-]+)/);
  if (chMatch) return { id: chMatch[1] };
  // 순수 문자열 → 핸들로 간주
  return { forHandle: s.startsWith("@") ? s : `@${s}` };
}

export async function fetchYoutubeSubscribers(
  channelInput: string
): Promise<number | null> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return null;
  const parsed = parseChannel(channelInput);
  if (!parsed) return null;

  const params = new URLSearchParams({ part: "statistics", key });
  if (parsed.id) params.set("id", parsed.id);
  else if (parsed.forHandle) params.set("forHandle", parsed.forHandle);

  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${params}`,
      { next: { revalidate: 21600 } } // 6시간 캐시
    );
    if (!res.ok) return null;
    const json = await res.json();
    const count = json?.items?.[0]?.statistics?.subscriberCount;
    return count ? Number(count) : null;
  } catch {
    return null;
  }
}

export interface YoutubeVideo {
  id: string; // videoId
  title: string;
  thumbnail: string;
  publishedAt: string;
}

/** 채널 최근 업로드 영상 — 상세 페이지 카드 스크롤용. 실패 시 [] */
export async function fetchYoutubeVideos(
  channelInput: string,
  max = 8
): Promise<YoutubeVideo[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const parsed = parseChannel(channelInput);
  if (!parsed) return [];

  try {
    // 1) 채널 → 업로드 재생목록
    const chParams = new URLSearchParams({ part: "contentDetails", key });
    if (parsed.id) chParams.set("id", parsed.id);
    else if (parsed.forHandle) chParams.set("forHandle", parsed.forHandle);
    const chRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${chParams}`,
      { next: { revalidate: 21600 } }
    );
    if (!chRes.ok) return [];
    const uploads =
      (await chRes.json())?.items?.[0]?.contentDetails?.relatedPlaylists
        ?.uploads;
    if (!uploads) return [];

    // 2) 재생목록 → 최근 영상
    const plParams = new URLSearchParams({
      part: "snippet",
      playlistId: uploads,
      maxResults: String(max),
      key,
    });
    const plRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?${plParams}`,
      { next: { revalidate: 21600 } }
    );
    if (!plRes.ok) return [];
    const items = (await plRes.json())?.items ?? [];
    return items
      .map(
        (i: {
          snippet?: {
            title?: string;
            publishedAt?: string;
            resourceId?: { videoId?: string };
            thumbnails?: { medium?: { url?: string }; high?: { url?: string } };
          };
        }) => ({
          id: i.snippet?.resourceId?.videoId ?? "",
          title: i.snippet?.title ?? "",
          thumbnail:
            i.snippet?.thumbnails?.medium?.url ??
            i.snippet?.thumbnails?.high?.url ??
            "",
          publishedAt: i.snippet?.publishedAt ?? "",
        })
      )
      .filter((v: YoutubeVideo) => v.id && v.thumbnail);
  } catch {
    return [];
  }
}
