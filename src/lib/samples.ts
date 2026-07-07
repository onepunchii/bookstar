import type { Role } from "./role-store";

export interface Scenario {
  id: string;
  role: Role;
  path: string;
  emoji: string;
  title: string;
  subtitle: string;
  // 페이지 상단에 뜨는 코치 배너 문구 — "여기서 이걸 해보세요"
  hint: string;
}

export const SCENARIOS: Scenario[] = [
  // ── 광고주 ──
  {
    id: "browse",
    role: "company",
    path: "/artists?category=idol",
    emoji: "🔍",
    title: "아이돌 카테고리 검색",
    subtitle: "카테고리·예산·키워드 필터로 딱 맞는 아티스트 찾기",
    hint: "예산 필터(1천~5천만원)나 다른 카테고리를 눌러 결과가 즉시 바뀌는 걸 확인해보세요.",
  },
  {
    id: "profile",
    role: "company",
    path: "/artists/a1",
    emoji: "📅",
    title: "리센느 프로필 · 가능 일정 확인",
    subtitle: "월 캘린더에 가능/불가만 공개되는 프라이버시 구조",
    hint: "오른쪽 사이드의 '섭외 요청하기'를 누르면 표준 브리프 폼으로 이동해요. 캘린더에는 가능 여부만 공개돼요.",
  },
  {
    id: "chat",
    role: "company",
    path: "/requests/r1",
    emoji: "💬",
    title: "협의 중인 섭외 채팅",
    subtitle: "정하늘 유튜브 콜라보 · 견적 1,800만원 협의",
    hint: "우측에 최근 견적 카드와 진행 단계가 실시간으로 보여요. 소속사와의 왕복이 한 곳에서 정리됩니다.",
  },
  // ── 소속사 ──
  {
    id: "agency-home",
    role: "agency",
    path: "/agency",
    emoji: "📊",
    title: "소속사 대시보드",
    subtitle: "새 요청·협의 중·평균 응답·이번 달 확정 매출 KPI",
    hint: "오늘의 아티스트별 일정, 프로필 완성도 낮은 순 등 매니저가 매일 확인할 것들이 한눈에 보여요.",
  },
  {
    id: "inbox",
    role: "agency",
    path: "/agency/inbox",
    emoji: "🎯",
    title: "인박스 · 프리셋 견적 · 홀드 자동화",
    subtitle: "요청 수락하면 캘린더 홀드가 자동 생성",
    hint: "부산문화재단 요청을 열어 오른쪽 상단 '프리셋 · 4,000만원' 버튼을 눌러보세요. 3개 필드가 원클릭으로 채워집니다.",
  },
  {
    id: "ai-intake",
    role: "agency",
    path: "/agency/inbox",
    emoji: "🤖",
    title: "AI 공문 인식",
    subtitle: "공문 PDF에서 날짜·출연료·담당자 자동 추출",
    hint: "왼쪽 상단 대시된 'AI 공문 인식' 카드를 눌러보세요. 성동구청 공문에서 정보를 추출해 새 요청 카드로 만들어줍니다.",
  },
  {
    id: "today",
    role: "agency",
    path: "/agency/today",
    emoji: "🕒",
    title: "데일리 스케줄표 · 카톡 전파",
    subtitle: "픽업→헤메코→본번까지 아티스트별 타임라인",
    hint: "우측 상단 '전체 카톡 전파' 또는 각 카드의 '카톡 전파'를 눌러보세요. 알림톡 발송 후 '읽음 2/3' 상태로 바뀝니다.",
  },
  {
    id: "schedule",
    role: "agency",
    path: "/agency/schedule",
    emoji: "🗓️",
    title: "일정 관리 · 드래그 다중 편집",
    subtitle: "여러 날 한 번에 가능/불가 처리",
    hint: "캘린더 위에서 여러 날짜를 드래그하면 하단에 액션 바가 떠요. '불가'를 누르면 한 번에 처리됩니다.",
  },
  {
    id: "profile-edit",
    role: "agency",
    path: "/agency/artists/a1",
    emoji: "📸",
    title: "프로필 편집 · WebP 자동 변환",
    subtitle: "사진 업로드 시 WebP 변환 + 리사이즈로 용량 최대 99% 절감",
    hint: "'사진' 섹션의 대표 사진 슬롯에 이미지를 올려보세요. 변환된 크기와 절감률이 배지로 표시됩니다.",
  },
  {
    id: "settlement",
    role: "agency",
    path: "/agency/settlement",
    emoji: "💸",
    title: "정산 · 원천징수 3.3% 자동 계산",
    subtitle: "총 출연료 → 분배율 → 원천징수 → 실지급액",
    hint: "미수금(오렌지 배너)의 '입금 리마인더' 버튼을 눌러보세요. 세금계산서 발행도 원클릭입니다.",
  },
  // ── 아티스트 ──
  {
    id: "me",
    role: "artist",
    path: "/me",
    emoji: "🎤",
    title: "오늘의 콜타임",
    subtitle: "픽업 → 헤메코 → 촬영 타임라인 + 원터치 내비",
    hint: "블랙 카드의 콜타임이 눈에 확 들어와요. 각 스텝의 '내비' 버튼으로 바로 이동할 수 있어요.",
  },
  {
    id: "leave",
    role: "artist",
    path: "/me/leave",
    emoji: "🏝️",
    title: "휴가 신청 · 소속사 승인 크로스 플로우",
    subtitle: "신청 → 소속사가 승인 → 캘린더 자동 불가 처리",
    hint: "날짜와 사유를 입력해 신청하세요. 소속사 모드로 전환하면 일정 관리에 승인 카드가 바로 뜹니다.",
  },
  {
    id: "earnings",
    role: "artist",
    path: "/me/earnings",
    emoji: "💰",
    title: "내 정산 투명 공개",
    subtitle: "건별 출연료·분배율·원천징수·실수령까지",
    hint: "카드 안의 총 출연료 → 소속사 몫 → 원천징수 → 실수령까지 전 과정이 아티스트에게도 공개됩니다.",
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}

export const ROLE_LABEL: Record<Role, string> = {
  company: "광고주",
  agency: "소속사",
  artist: "아티스트",
};
