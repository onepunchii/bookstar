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
