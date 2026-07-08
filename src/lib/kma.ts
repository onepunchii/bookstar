// 기상청 단기예보(공공데이터포털) — 서버 전용. 실데이터는 +3일까지만 제공.
// 카카오 지오코딩이 막혀 있어 행정구역 키워드 → KMA 격자(nx,ny) 룩업으로 우회.
import type { WeatherCondition, WeatherForecast } from "@/lib/weather";

// 주요 지역 격자 좌표 (기상청 동네예보 격자). 키워드 우선순위대로 매칭.
const GRID: { kw: string[]; nx: number; ny: number }[] = [
  { kw: ["해운대", "부산"], nx: 98, ny: 76 },
  { kw: ["수영", "광안"], nx: 98, ny: 75 },
  { kw: ["대구"], nx: 89, ny: 90 },
  { kw: ["인천", "송도"], nx: 55, ny: 124 },
  { kw: ["광주"], nx: 58, ny: 74 },
  { kw: ["대전"], nx: 67, ny: 100 },
  { kw: ["울산"], nx: 102, ny: 84 },
  { kw: ["세종"], nx: 66, ny: 103 },
  { kw: ["수원", "경기"], nx: 60, ny: 121 },
  { kw: ["고양", "일산"], nx: 57, ny: 128 },
  { kw: ["성남", "분당"], nx: 63, ny: 124 },
  { kw: ["제주"], nx: 52, ny: 38 },
  { kw: ["강릉"], nx: 92, ny: 131 },
  { kw: ["전주"], nx: 63, ny: 89 },
  { kw: ["춘천"], nx: 73, ny: 134 },
  // 서울 세부 (성수/코엑스/강남/서울숲 등) → 서울 격자
  { kw: ["성수", "코엑스", "강남", "서울숲", "잠실", "서울"], nx: 60, ny: 127 },
];

function gridFor(location?: string): { nx: number; ny: number } {
  if (location) {
    for (const g of GRID) if (g.kw.some((k) => location.includes(k))) return g;
  }
  return { nx: 60, ny: 127 }; // 기본: 서울
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// 가장 최근 발표(02,05,08,11,14,17,20,23시) 기준 base_date/base_time
function latestBase(now: Date): { baseDate: string; baseTime: string } {
  const slots = [2, 5, 8, 11, 14, 17, 20, 23];
  const d = new Date(now.getTime() - 45 * 60000); // 발표 지연 ~45분 여유
  let hour = d.getHours();
  let slot = -1;
  for (const s of slots) if (hour >= s) slot = s;
  let y = d.getFullYear();
  let m = d.getMonth() + 1;
  let day = d.getDate();
  if (slot === -1) {
    // 오늘 02시 이전 → 전날 23시
    const yd = new Date(d.getTime() - 24 * 3600000);
    y = yd.getFullYear();
    m = yd.getMonth() + 1;
    day = yd.getDate();
    slot = 23;
  }
  return {
    baseDate: `${y}${pad(m)}${pad(day)}`,
    baseTime: `${pad(slot)}00`,
  };
}

function skyPtyToCondition(sky?: string, pty?: string): WeatherCondition {
  // PTY: 0없음 1비 2비/눈 3눈 4소나기
  if (pty === "1" || pty === "4") return "rain";
  if (pty === "2") return "rain";
  if (pty === "3") return "snow";
  // SKY: 1맑음 3구름많음 4흐림
  if (sky === "4" || sky === "3") return "cloud";
  return "sun";
}

/**
 * 실 KMA 단기예보. 대상일이 발표 범위를 벗어나거나 실패하면 null(→ 호출부에서 mock 폴백).
 * date: YYYY-MM-DD
 */
export async function fetchKmaForecast(
  date: string,
  location?: string
): Promise<WeatherForecast | null> {
  const key = process.env.KMA_SERVICE_KEY;
  if (!key) return null;

  const now = new Date();
  const target = date.replace(/-/g, "");
  const { baseDate, baseTime } = latestBase(now);
  const { nx, ny } = gridFor(location);

  // 단기예보는 base_date 포함 +3일까지만
  const diff = Math.round(
    (new Date(date).getTime() - new Date(now.toISOString().slice(0, 10)).getTime()) /
      86400000
  );
  if (diff < 0 || diff > 3) return null;

  // serviceKey는 이미 URL 인코딩된 값 → 직접 문자열 조합(재인코딩 금지)
  const url =
    `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst` +
    `?serviceKey=${key}&pageNo=1&numOfRows=1000&dataType=JSON` +
    `&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

  try {
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;
    const json = await res.json();
    if (json?.response?.header?.resultCode !== "00") return null;
    const items: { category: string; fcstDate: string; fcstValue: string }[] =
      json.response.body.items.item;

    const forDay = items.filter((i) => i.fcstDate === target);
    if (forDay.length === 0) return null;

    const tmps = forDay
      .filter((i) => i.category === "TMP")
      .map((i) => Number(i.fcstValue));
    const pops = forDay
      .filter((i) => i.category === "POP")
      .map((i) => Number(i.fcstValue));
    const tmx = forDay.find((i) => i.category === "TMX")?.fcstValue;
    const tmn = forDay.find((i) => i.category === "TMN")?.fcstValue;
    const sky = forDay.find((i) => i.category === "SKY")?.fcstValue;
    const pty = forDay.find((i) => i.category === "PTY")?.fcstValue;

    const rainProb = pops.length ? Math.max(...pops) : 0;
    const tempHigh = tmx
      ? Math.round(Number(tmx))
      : tmps.length
        ? Math.max(...tmps)
        : 0;
    const tempLow = tmn
      ? Math.round(Number(tmn))
      : tmps.length
        ? Math.min(...tmps)
        : 0;

    let condition = skyPtyToCondition(sky, pty);
    if (condition === "rain" && rainProb >= 70) condition = "storm";

    return {
      date,
      condition,
      tempHigh,
      tempLow,
      rainProb,
      tier: diff <= 0 ? "observed" : "short",
      tierLabel: diff <= 0 ? "실측" : "기상청 예보",
    };
  } catch {
    return null;
  }
}
