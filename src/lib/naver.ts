// 네이버 오픈API — 서버 전용. 화제성(검색 트렌드 + 기사 수) 실데이터.
// 키 없거나 실패하면 null → 호출부에서 mock 폴백.

interface NaverMomentum {
  searchSeries: number[]; // 최근 ~30일 일별 검색 트렌드 (0~100)
  newsCount: number; // 네이버 뉴스 검색 총 건수
}

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export async function fetchNaverMomentum(
  name: string,
  categoryHint?: string | null
): Promise<NaverMomentum | null> {
  const id = process.env.NAVER_CLIENT_ID;
  const secret = process.env.NAVER_CLIENT_SECRET;
  if (!id || !secret || !name) return null;

  const headers = {
    "X-Naver-Client-Id": id,
    "X-Naver-Client-Secret": secret,
  };
  // 기사 검색은 카테고리를 결합해 관련도↑ (예: "원팀 아이돌" — 동명 단어 오매핑 완화).
  // 검색 트렌드는 사람들이 실제로 검색하는 이름 그대로.
  const newsQuery = categoryHint ? `"${name}" ${categoryHint}` : name;

  try {
    // 1) 데이터랩 검색 트렌드 (최근 30일 일별)
    const end = new Date();
    end.setDate(end.getDate() - 1); // 데이터랩은 어제까지
    const start = new Date(end);
    start.setDate(start.getDate() - 29);

    const [trendRes, newsRes] = await Promise.all([
      fetch("https://openapi.naver.com/v1/datalab/search", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: ymd(start),
          endDate: ymd(end),
          timeUnit: "date",
          keywordGroups: [{ groupName: name, keywords: [name] }],
        }),
        next: { revalidate: 3600 },
      }),
      fetch(
        `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
          newsQuery
        )}&display=1`,
        { headers, next: { revalidate: 3600 } }
      ),
    ]);

    let searchSeries: number[] = [];
    if (trendRes.ok) {
      const j = await trendRes.json();
      const data: { period: string; ratio: number }[] =
        j?.results?.[0]?.data ?? [];
      searchSeries = data.map((d) => Math.round(d.ratio));
    }

    let newsCount = 0;
    if (newsRes.ok) {
      const j = await newsRes.json();
      newsCount = Number(j?.total ?? 0);
    }

    // 트렌드가 비거나 전부 0(가상·저노출 인물)이면 실데이터로 볼 수 없음 → 폴백
    if (searchSeries.length === 0 || searchSeries.every((v) => v === 0))
      return null;

    return { searchSeries, newsCount };
  } catch {
    return null;
  }
}
