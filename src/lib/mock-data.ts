import type {
  Artist,
  BookingRequest,
  DaySchedule,
  DocumentItem,
  Manager,
  Review,
  ScheduleDay,
  Settlement,
  ThreadMessage,
} from "./types";

export const ARTISTS: Artist[] = [
  {
    id: "a1",
    slug: "lisenne",
    name: "리센느",
    agencyName: "웨이크원",
    category: "idol",
    categories: ["idol"],
    gender: "group",
    tagline: "5인조 걸그룹 · 밝고 트렌디한 브랜드 이미지",
    followers: 1250000,
    responseRate: 98,
    responseHours: 6,
    budgetRange: [3000, 8000],
    tags: ["걸그룹", "10-20대", "뷰티", "패션"],
    verified: true,
    recentWork: ["뷰티 브랜드 A 광고", "대학 축제 12회", "음악방송 출연"],
    quotePreset: {
      baseFee: 4000,
      includes: "공연 30분 (4곡) + 포토타임",
      note: "지방 행사 시 이동비 별도, 리허설 포함",
    },
  },
  {
    id: "a2",
    slug: "qwer",
    name: "QWER",
    agencyName: "타마고프로덕션",
    category: "idol",
    categories: ["idol"],
    gender: "group",
    tagline: "밴드형 아이돌 · 강한 팬덤과 유튜브 화제성",
    followers: 2100000,
    responseRate: 95,
    responseHours: 12,
    budgetRange: [5000, 12000],
    tags: ["밴드", "유튜브", "MZ", "축제"],
    verified: true,
    recentWork: ["게임 브랜드 콜라보", "지역 축제 헤드라이너", "예능 고정"],
  },
  {
    id: "a3",
    slug: "kimseoyeon",
    name: "김서연",
    agencyName: "매니지먼트숲",
    category: "actor",
    categories: ["actor", "mc"],
    gender: "female",
    tagline: "드라마 주연급 배우 · 신뢰감 있는 프리미엄 이미지",
    followers: 890000,
    responseRate: 92,
    responseHours: 24,
    budgetRange: [8000, 20000],
    tags: ["3040", "금융", "프리미엄"],
    verified: true,
    recentWork: ["금융사 브랜드 모델", "드라마 주연", "시상식 MC"],
    quotePreset: {
      baseFee: 10000,
      includes: "촬영 1일 + 온라인 광고 사용권 6개월",
      note: "전속·독점 조항은 별도 협의",
    },
  },
  {
    id: "a4",
    slug: "parkdohyun",
    name: "박도현",
    agencyName: "에스팀",
    category: "model",
    categories: ["model", "influencer"],
    gender: "male",
    tagline: "패션위크 톱모델 · 하이엔드 패션·뷰티 특화",
    followers: 450000,
    responseRate: 97,
    responseHours: 4,
    budgetRange: [1500, 4000],
    tags: ["패션", "럭셔리", "화보", "SNS"],
    verified: true,
    recentWork: ["서울패션위크", "명품 브랜드 화보", "SNS 캠페인"],
  },
  {
    id: "a5",
    slug: "haneul",
    name: "정하늘",
    agencyName: "샌드박스네트워크",
    category: "influencer",
    categories: ["influencer", "mc"],
    gender: "female",
    tagline: "구독자 180만 라이프스타일 크리에이터",
    followers: 1800000,
    responseRate: 99,
    responseHours: 3,
    budgetRange: [800, 2500],
    tags: ["유튜브", "라이프스타일", "브이로그", "리뷰"],
    verified: true,
    recentWork: ["가전 브랜드 리뷰", "팝업스토어 진행", "브랜드 라이브커머스"],
    quotePreset: {
      baseFee: 1200,
      includes: "영상 1편 (10분 내) + 인스타 스토리 2회",
      note: "라이브커머스 추가 시 +500만원",
    },
  },
  {
    id: "a6",
    slug: "leejunho",
    name: "이준호",
    agencyName: "JH컴퍼니",
    category: "mc",
    categories: ["mc", "speaker"],
    gender: "male",
    tagline: "기업 행사 전문 MC · 500회 이상 진행 경력",
    followers: 120000,
    responseRate: 100,
    responseHours: 2,
    budgetRange: [300, 1000],
    tags: ["기업행사", "시상식", "컨퍼런스", "베테랑"],
    verified: true,
    recentWork: ["대기업 신년회", "IT 컨퍼런스", "지자체 행사"],
    quotePreset: {
      baseFee: 500,
      includes: "행사 진행 4시간 + 사전 대본 리뷰 + 리허설",
      note: "심야·주말 진행 시 20% 할증",
    },
  },
  {
    id: "a7",
    slug: "mina",
    name: "최민아",
    agencyName: "크리에이티브랩",
    category: "influencer",
    categories: ["influencer"],
    gender: "female",
    tagline: "푸드 콘텐츠 크리에이터 · 높은 구매 전환율",
    followers: 950000,
    responseRate: 96,
    responseHours: 5,
    budgetRange: [500, 1800],
    tags: ["푸드", "먹방", "F&B", "숏폼"],
    verified: false,
    recentWork: ["식품 브랜드 캠페인", "맛집 프랜차이즈 협업", "숏폼 챌린지"],
  },
  {
    id: "a8",
    slug: "taeyoon",
    name: "강태윤",
    agencyName: "스포츠원",
    category: "athlete",
    categories: ["athlete", "speaker"],
    gender: "male",
    tagline: "전 국가대표 · 스포츠 브랜드와 동기부여 강연",
    followers: 380000,
    responseRate: 90,
    responseHours: 36,
    budgetRange: [1000, 3500],
    tags: ["스포츠", "강연", "아웃도어", "건강"],
    verified: true,
    recentWork: ["스포츠 브랜드 앰버서더", "기업 특강", "예능 출연"],
  },
];

function july(day: number): string {
  return `2026-07-${String(day).padStart(2, "0")}`;
}

export const SCHEDULES: Record<string, ScheduleDay[]> = Object.fromEntries(
  ARTISTS.map((artist, idx) => [
    artist.id,
    Array.from({ length: 31 }, (_, i) => {
      const day = i + 1;
      // 아티스트별로 패턴을 달리한 데모 일정
      const cycle = (day + idx * 3) % 7;
      const availability =
        cycle === 0 || cycle === 3
          ? "busy"
          : cycle === 5
            ? "partial"
            : cycle === 6
              ? "hold"
              : "available";
      return {
        date: july(day),
        availability,
        note: availability === "partial" ? "오전만 가능" : undefined,
      } as ScheduleDay;
    }),
  ])
);

export const BOOKING_REQUESTS: BookingRequest[] = [
  {
    id: "r1",
    artistId: "a5",
    artistName: "정하늘",
    companyName: "(주)브라이트마케팅",
    companyVerified: true,
    companyEventCount: 12,
    eventType: "유튜브",
    budget: 1500,
    location: "서울 성수동",
    date: "2026-07-24",
    message: "신제품 런칭 언박싱 콘텐츠 + 팝업 방문 브이로그 제안드립니다.",
    status: "negotiating",
    createdAt: "2026-07-03T10:20:00+09:00",
    unreadCount: 2,
  },
  {
    id: "r2",
    artistId: "a1",
    artistName: "리센느",
    companyName: "부산문화재단",
    companyVerified: true,
    companyEventCount: 8,
    eventType: "축제",
    budget: 5000,
    location: "부산 해운대",
    date: "2026-08-15",
    message: "여름 뮤직페스티벌 서브 헤드라이너 섭외 문의드립니다.",
    status: "reviewing",
    createdAt: "2026-07-05T14:00:00+09:00",
  },
  {
    id: "r3",
    artistId: "a6",
    artistName: "이준호",
    companyName: "(주)코엑스이벤트",
    companyVerified: true,
    companyEventCount: 27,
    eventType: "행사",
    budget: 600,
    location: "서울 코엑스",
    date: "2026-07-18",
    message: "IT 컨퍼런스 오프닝 및 패널 토크 진행 요청드립니다.",
    status: "accepted",
    createdAt: "2026-06-28T09:30:00+09:00",
  },
  {
    id: "r4",
    artistId: "a3",
    artistName: "김서연",
    companyName: "뉴웨이브기획",
    companyVerified: false,
    eventType: "광고",
    budget: 12000,
    location: "서울 강남",
    date: "2026-09-02",
    message: "금융 앱 TVC 캠페인 모델 제안입니다. 6개월 전속 조건 포함.",
    status: "pending",
    createdAt: "2026-07-06T17:45:00+09:00",
  },
];

export const THREAD_MESSAGES: ThreadMessage[] = [
  {
    id: "m1",
    requestId: "r1",
    sender: "system",
    senderName: "BOOKSTAR",
    body: "섭외 요청이 접수되었습니다. 소속사 응답 예상 시간: 3시간 이내",
    createdAt: "2026-07-03T10:20:00+09:00",
  },
  {
    id: "m2",
    requestId: "r1",
    sender: "agency",
    senderName: "샌드박스네트워크 김매니저",
    body: "안녕하세요! 제안 잘 받았습니다. 언박싱 + 브이로그 패키지는 가능하고, 라이브커머스 추가 시 견적이 조정됩니다. 상세 브리프 공유 부탁드립니다.",
    createdAt: "2026-07-03T12:05:00+09:00",
  },
  {
    id: "m3",
    requestId: "r1",
    sender: "company",
    senderName: "브라이트마케팅 이대리",
    body: "브리프 첨부드립니다. 라이브커머스 1회 추가하면 총액 어느 정도로 가능할까요?",
    createdAt: "2026-07-03T14:30:00+09:00",
  },
  {
    id: "m4",
    requestId: "r1",
    sender: "agency",
    senderName: "샌드박스네트워크 김매니저",
    body: "라이브 1회 포함 총 1,800만원으로 견적 드립니다. 7/24 일정 홀드 걸어두겠습니다.",
    createdAt: "2026-07-04T09:15:00+09:00",
  },
];

// ── 데일리 스케줄 (7/7 ~ 7/9 데모) ──
export const DAY_SCHEDULES: DaySchedule[] = [
  {
    id: "d1",
    artistId: "a1",
    artistName: "리센느",
    date: "2026-07-07",
    title: "음악방송 생방송",
    eventType: "방송",
    manager: "김도윤 팀장",
    vehicle: "카니발 12허 3456",
    stops: [
      { time: "06:30", label: "픽업", location: "숙소 (성수동)" },
      { time: "07:30", label: "헤메코", location: "청담 살롱드뮤즈" },
      { time: "10:00", label: "방송국 도착", location: "상암 MBC" },
      { time: "13:30", label: "리허설" },
      { time: "17:00", label: "본방송" },
      { time: "19:00", label: "종료 · 복귀" },
    ],
    memo: "포토타임 있음, 의상 2벌 준비",
  },
  {
    id: "d2",
    artistId: "a2",
    artistName: "QWER",
    date: "2026-07-07",
    title: "여름 축제 사전 리허설",
    eventType: "축제",
    manager: "박세진 실장",
    vehicle: "스타리아 34나 7788",
    stops: [
      { time: "13:00", label: "픽업", location: "합정 연습실" },
      { time: "15:00", label: "현장 도착", location: "난지 한강공원" },
      { time: "16:00", label: "사운드체크" },
      { time: "18:00", label: "종료" },
    ],
  },
  {
    id: "d3",
    artistId: "a6",
    artistName: "이준호",
    date: "2026-07-07",
    title: "IT 컨퍼런스 진행",
    eventType: "행사",
    manager: "최유나 매니저",
    stops: [
      { time: "08:00", label: "현장 도착", location: "코엑스 그랜드볼룸" },
      { time: "09:00", label: "큐시트 리뷰" },
      { time: "10:00", label: "오프닝 진행" },
      { time: "16:00", label: "패널 토크" },
      { time: "17:30", label: "종료" },
    ],
    memo: "정장 착용, 명찰 수령 필요",
  },
  {
    id: "d4",
    artistId: "a5",
    artistName: "정하늘",
    date: "2026-07-07",
    title: "브랜드 협업 촬영",
    eventType: "유튜브",
    manager: "김매니저",
    vehicle: "쏘렌토 55다 1122",
    stops: [
      { time: "09:00", label: "픽업", location: "자택 (마포)" },
      { time: "10:00", label: "스튜디오 도착", location: "성수 A스튜디오" },
      { time: "10:30", label: "촬영 시작" },
      { time: "15:00", label: "종료 · 복귀" },
    ],
  },
  {
    id: "d5",
    artistId: "a1",
    artistName: "리센느",
    date: "2026-07-08",
    title: "뷰티 브랜드 화보 촬영",
    eventType: "광고",
    manager: "김도윤 팀장",
    vehicle: "카니발 12허 3456",
    stops: [
      { time: "08:00", label: "픽업", location: "숙소 (성수동)" },
      { time: "09:30", label: "스튜디오 도착", location: "논현 B스튜디오" },
      { time: "10:00", label: "촬영" },
      { time: "18:00", label: "종료" },
    ],
  },
  {
    id: "d6",
    artistId: "a8",
    artistName: "강태윤",
    date: "2026-07-08",
    title: "기업 특강",
    eventType: "강연",
    manager: "최유나 매니저",
    stops: [
      { time: "13:00", label: "현장 도착", location: "판교 테크타워" },
      { time: "14:00", label: "강연" },
      { time: "16:00", label: "종료" },
    ],
  },
];

// ── 정산 ──
export const SETTLEMENTS: Settlement[] = [
  {
    id: "s1",
    artistId: "a6",
    artistName: "이준호",
    eventTitle: "IT 컨퍼런스 진행 (코엑스이벤트)",
    date: "2026-07-18",
    gross: 600,
    agencyRate: 0.3,
    status: "pending",
    taxInvoice: true,
  },
  {
    id: "s2",
    artistId: "a5",
    artistName: "정하늘",
    eventTitle: "가전 브랜드 리뷰 영상",
    date: "2026-06-20",
    gross: 1400,
    agencyRate: 0.2,
    status: "paid",
    taxInvoice: true,
  },
  {
    id: "s3",
    artistId: "a1",
    artistName: "리센느",
    eventTitle: "대학 축제 공연 (5월)",
    date: "2026-05-24",
    gross: 3500,
    agencyRate: 0.3,
    status: "paid",
    taxInvoice: true,
  },
  {
    id: "s4",
    artistId: "a2",
    artistName: "QWER",
    eventTitle: "게임 브랜드 콜라보 행사",
    date: "2026-06-05",
    gross: 6000,
    agencyRate: 0.3,
    status: "overdue",
    taxInvoice: false,
  },
  {
    id: "s5",
    artistId: "a5",
    artistName: "정하늘",
    eventTitle: "팝업스토어 진행",
    date: "2026-06-28",
    gross: 900,
    agencyRate: 0.2,
    status: "pending",
    taxInvoice: false,
  },
];

// ── 서류함 ──
export const DOCUMENTS: DocumentItem[] = [
  {
    id: "doc1",
    name: "출연 계약서_이준호_코엑스.pdf",
    type: "계약서",
    eventTitle: "IT 컨퍼런스",
    artistName: "이준호",
    date: "2026-07-01",
  },
  {
    id: "doc2",
    name: "큐시트_IT컨퍼런스_v3.xlsx",
    type: "큐시트",
    eventTitle: "IT 컨퍼런스",
    artistName: "이준호",
    date: "2026-07-05",
  },
  {
    id: "doc3",
    name: "섭외 공문_부산문화재단.pdf",
    type: "공문",
    eventTitle: "여름 뮤직페스티벌",
    artistName: "리센느",
    date: "2026-07-04",
  },
  {
    id: "doc4",
    name: "정산서_정하늘_6월.pdf",
    type: "정산서",
    eventTitle: "가전 브랜드 리뷰",
    artistName: "정하늘",
    date: "2026-07-02",
  },
  {
    id: "doc5",
    name: "출연 계약서_QWER_게임콜라보.pdf",
    type: "계약서",
    eventTitle: "게임 브랜드 콜라보",
    artistName: "QWER",
    date: "2026-05-28",
  },
];

// ── 리뷰 ──
export const REVIEWS: Review[] = [
  {
    id: "rv1",
    artistId: "a1",
    companyName: "뷰티프리즘",
    eventTitle: "봄 뷰티 브랜드 캠페인",
    rating: 5,
    comment:
      "현장 매너, 촬영 몰입도 모두 최고. 대기실 요구도 합리적이었고 다음 시즌에도 재섭외 예정입니다.",
    createdAt: "2026-06-12T00:00:00+09:00",
  },
  {
    id: "rv2",
    artistId: "a1",
    companyName: "한강대학교",
    eventTitle: "대학 축제",
    rating: 5,
    comment: "무대 반응 폭발. 팬 응대까지 챙겨주셔서 감사합니다.",
    createdAt: "2026-05-28T00:00:00+09:00",
  },
  {
    id: "rv3",
    artistId: "a6",
    companyName: "코엑스이벤트",
    eventTitle: "IT 컨퍼런스 진행",
    rating: 5,
    comment: "큐시트 사전 리뷰까지 꼼꼼히 해주셔서 라이브가 매끄럽게 진행됐어요.",
    createdAt: "2026-06-30T00:00:00+09:00",
  },
  {
    id: "rv4",
    artistId: "a5",
    companyName: "브라이트마케팅",
    eventTitle: "가전 브랜드 리뷰 영상",
    rating: 4,
    comment: "구성력 좋음. 편집 방향 협의만 조금 더 사전 조율되면 완벽할 듯.",
    createdAt: "2026-06-22T00:00:00+09:00",
  },
  {
    id: "rv5",
    artistId: "a2",
    companyName: "게임하우스",
    eventTitle: "게임 브랜드 콜라보 행사",
    rating: 5,
    comment: "밴드 사운드 자체가 콘텐츠. 팬덤 유입 효과가 큰 섭외였습니다.",
    createdAt: "2026-06-10T00:00:00+09:00",
  },
];

export function getReviewsFor(artistId: string) {
  return REVIEWS.filter((r) => r.artistId === artistId);
}

export function getRatingSummary(artistId: string) {
  const rs = REVIEWS.filter((r) => r.artistId === artistId);
  if (rs.length === 0) return { avg: 0, count: 0 };
  const avg = rs.reduce((sum, r) => sum + r.rating, 0) / rs.length;
  return { avg: Math.round(avg * 10) / 10, count: rs.length };
}

// ── 매니저 ──
export const MANAGERS: Manager[] = [
  {
    id: "m1",
    name: "박세진",
    role: "실장",
    phone: "010-1234-5678",
    artistIds: ["a2", "a3"],
  },
  {
    id: "m2",
    name: "김도윤",
    role: "팀장",
    phone: "010-2345-6789",
    artistIds: ["a1", "a4"],
  },
  {
    id: "m3",
    name: "최유나",
    role: "로드매니저",
    phone: "010-3456-7890",
    artistIds: ["a6", "a8"],
  },
  {
    id: "m4",
    name: "김민재",
    role: "로드매니저",
    phone: "010-4567-8901",
    artistIds: ["a5", "a7"],
  },
];

export function getArtist(id: string): Artist | undefined {
  return ARTISTS.find((a) => a.id === id);
}

export function getArtistBySlug(slug: string): Artist | undefined {
  return ARTISTS.find((a) => a.slug === slug);
}

export function getRequest(id: string): BookingRequest | undefined {
  return BOOKING_REQUESTS.find((r) => r.id === id);
}

export function getThread(requestId: string): ThreadMessage[] {
  return THREAD_MESSAGES.filter((m) => m.requestId === requestId);
}
