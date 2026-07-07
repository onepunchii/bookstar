// 외부 API 실데이터 연동 상태 정의.
// 배포 환경변수가 있으면 Real 어댑터로 flip, 없으면 mock 유지.
// (실제 어댑터 구현은 각 기능이 Real 데이터를 쓰기 시작할 때 lib/metrics.ts, lib/weather.ts에서 조건 분기)

export interface IntegrationSpec {
  key: string;
  title: string;
  provider: string;
  purpose: string;
  envVar: string;
  signupUrl: string;
  freeTier: string;
}

export const INTEGRATIONS: IntegrationSpec[] = [
  {
    key: "naver-news",
    title: "네이버 뉴스 · 검색 트렌드",
    provider: "네이버 개발자센터",
    purpose: "아티스트 화제성 (일별 기사 카운트, 검색 트렌드)",
    envVar: "NAVER_CLIENT_ID / NAVER_CLIENT_SECRET",
    signupUrl: "https://developers.naver.com/apps",
    freeTier: "뉴스 25,000콜/일 · 데이터랩 1,000콜/일",
  },
  {
    key: "youtube",
    title: "YouTube Data API v3",
    provider: "Google Cloud Console",
    purpose: "아티스트 구독자 수·조회수 (팬덤 규모)",
    envVar: "YOUTUBE_API_KEY",
    signupUrl: "https://console.cloud.google.com/apis/library/youtube.googleapis.com",
    freeTier: "10,000 유닛/일 (500채널 배치 = 쿼터 0.1%)",
  },
  {
    key: "kma",
    title: "기상청 단기·중기예보",
    provider: "공공데이터포털",
    purpose: "행사일 날씨·강수확률 (우천 리스크 알림)",
    envVar: "KMA_SERVICE_KEY",
    signupUrl:
      "https://www.data.go.kr/data/15059468/openapi.do",
    freeTier: "100,000콜/일",
  },
  {
    key: "kakao-local",
    title: "카카오 로컬 API",
    provider: "Kakao Developers",
    purpose: "장소명·주소 → 위경도·기상청 격자 좌표 변환",
    envVar: "KAKAO_REST_API_KEY",
    signupUrl: "https://developers.kakao.com/console/app",
    freeTier: "300,000콜/일",
  },
];

// 어떤 통합이 연결됐는지 (서버 사이드 확인)
export function integrationStatus() {
  const status: Record<string, boolean> = {};
  status["naver-news"] = Boolean(
    process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET
  );
  status["youtube"] = Boolean(process.env.YOUTUBE_API_KEY);
  status["kma"] = Boolean(process.env.KMA_SERVICE_KEY);
  status["kakao-local"] = Boolean(process.env.KAKAO_REST_API_KEY);
  return status;
}
