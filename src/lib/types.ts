export type ArtistCategory =
  | "idol"
  | "actor"
  | "model"
  | "mc"
  | "influencer"
  | "athlete"
  | "speaker";

export type EventType =
  | "행사"
  | "광고"
  | "유튜브"
  | "예능"
  | "팬미팅"
  | "축제"
  | "강연";

export type Availability = "available" | "partial" | "busy" | "hold";

export type BookingStatus =
  | "pending"
  | "reviewing"
  | "negotiating"
  | "accepted"
  | "rejected"
  | "completed";

export interface QuotePreset {
  baseFee: number; // 만원
  includes: string; // 기본 포함 항목
  note?: string; // 조건 메모 (이동비, 러닝타임 등)
}

export interface Artist {
  id: string;
  slug: string; // 공개 페이지 URL (`/@슬러그`)
  name: string;
  groupName?: string;
  agencyName: string;
  category: ArtistCategory;
  categories: ArtistCategory[];
  gender: "male" | "female" | "group";
  tagline: string;
  imageUrl?: string;
  galleryUrls?: string[]; // 추가 사진 (대표 외 최대 3장)
  followers: number;
  responseRate: number; // 0-100
  responseHours: number; // 평균 응답 시간
  budgetRange: [number, number]; // 만원 단위
  tags: string[];
  verified: boolean;
  recentWork: string[];
  quotePreset?: QuotePreset;
  // 소속사:아티스트 분배율 (0.3 = 소속사 30%). 정산 생성 시 기본값
  defaultAgencyRate?: number;
  instagram?: string;
  youtube?: string;
}

export interface ScheduleDay {
  date: string; // YYYY-MM-DD
  availability: Availability;
  note?: string; // 공개 메모 (예: "오전만 가능")
}

export interface BookingRequest {
  id: string;
  artistId: string;
  artistName: string;
  companyName: string;
  companyVerified: boolean; // 사업자 인증 여부
  companyEventCount?: number; // 플랫폼 내 행사 이력
  eventType: EventType;
  budget: number; // 만원
  location: string;
  date: string;
  message: string;
  status: BookingStatus;
  createdAt: string;
  unreadCount?: number;
  advancingChecked?: string[]; // 어드밴싱 완료 항목
}

export interface ThreadMessage {
  id: string;
  requestId: string;
  sender: "company" | "agency" | "system";
  senderName: string;
  body: string;
  createdAt: string;
}

// ── 데일리 스케줄표 ──
export interface DayStop {
  time: string; // HH:mm
  label: string; // 픽업, 헤메코, 현장 도착, 리허설, 본번, 종료 …
  location?: string;
}

export interface DaySchedule {
  id: string;
  artistId: string;
  artistName: string;
  date: string; // YYYY-MM-DD
  title: string; // 행사명
  eventType: string;
  manager: string;
  vehicle?: string;
  stops: DayStop[];
  memo?: string;
}

// ── 휴가/개인 일정 ──
export interface LeaveRequest {
  id: string;
  artistId: string;
  artistName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

// ── 정산 ──
export interface Settlement {
  id: string;
  artistId: string;
  artistName: string;
  eventTitle: string;
  date: string;
  gross: number; // 총 출연료 (만원)
  agencyRate: number; // 소속사 분배율 (0~1)
  status: "paid" | "pending" | "overdue";
  taxInvoice: boolean; // 세금계산서 발행 여부
}

export const WITHHOLDING_RATE = 0.033; // 원천징수 3.3%

export function settlementBreakdown(s: Settlement) {
  const agencyShare = Math.round(s.gross * s.agencyRate);
  const artistGross = s.gross - agencyShare;
  const withholding = Math.round(artistGross * WITHHOLDING_RATE * 10) / 10;
  const artistNet = Math.round((artistGross - withholding) * 10) / 10;
  return { agencyShare, artistGross, withholding, artistNet };
}

// ── 서류함 ──
export type DocType = "계약서" | "큐시트" | "공문" | "정산서";

export interface DocumentItem {
  id: string;
  name: string;
  type: DocType;
  eventTitle: string;
  artistName: string;
  date: string;
  fileUrl?: string;
}

// ── 라인업 번들 ──
export interface LineupBundle {
  id: string;
  title: string;
  subtitle: string;
  artistIds: string[];
  eventTypes: EventType[];
  totalBudget: [number, number]; // 만원
  discountPct?: number; // 세트 할인율
}

// ── 리뷰 ──
export interface Review {
  id: string;
  artistId: string;
  companyName: string;
  eventTitle: string;
  rating: number; // 1~5
  comment: string;
  createdAt: string;
}

// ── 매니저 ──
export interface Manager {
  id: string;
  name: string;
  role: string; // 실장, 팀장, 로드매니저
  phone: string;
  artistIds: string[];
}

export const CATEGORY_LABELS: Record<ArtistCategory, string> = {
  idol: "아이돌",
  actor: "배우",
  model: "모델",
  mc: "MC",
  influencer: "인플루언서",
  athlete: "스포츠",
  speaker: "강연자",
};

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "답변 대기",
  reviewing: "검토 중",
  negotiating: "협의 중",
  accepted: "수락됨",
  rejected: "거절됨",
  completed: "완료",
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  available: "가능",
  partial: "부분 가능",
  busy: "불가",
  hold: "협의 필요",
};

export function formatBudget(manwon: number): string {
  if (manwon >= 10000) {
    const eok = manwon / 10000;
    return `${Number.isInteger(eok) ? eok : eok.toFixed(1)}억원`;
  }
  return `${manwon.toLocaleString()}만원`;
}

export function formatFollowers(n: number): string {
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}천만`;
  if (n >= 10000) return `${Math.round(n / 10000)}만`;
  return n.toLocaleString();
}
