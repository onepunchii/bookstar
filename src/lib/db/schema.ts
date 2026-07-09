import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  date,
  pgEnum,
  uuid,
  jsonb,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const userRole = pgEnum("user_role", [
  "company",
  "agency",
  "admin",
  "artist",
]);
export const artistCategory = pgEnum("artist_category", [
  "idol",
  "actor",
  "model",
  "mc",
  "influencer",
  "athlete",
  "speaker",
]);
export const availability = pgEnum("availability", [
  "available",
  "partial",
  "busy",
  "hold",
]);
export const bookingStatus = pgEnum("booking_status", [
  "pending",
  "reviewing",
  "negotiating",
  "accepted",
  "rejected",
  "completed",
]);
export const messageSender = pgEnum("message_sender", [
  "company",
  "agency",
  "system",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  kakaoId: text("kakao_id").unique(), // 카카오 로그인 식별자(sub)
  email: text("email").unique(),
  passwordHash: text("password_hash"),
  role: userRole("role").notNull().default("company"),
  name: text("name").notNull(),
  phone: text("phone"),
  company: text("company"),
  // 광고주 구분 — personal(개인) | business(기업·브랜드)
  accountType: text("account_type").notNull().default("personal"),
  // 최초 로그인 후 역할 선택(광고주/소속사) 완료 여부 — false면 역할 선택 모달 노출
  onboarded: boolean("onboarded").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agencies = pgTable("agencies", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id),
  companyName: text("company_name").notNull(),
  // solo = 1인 기획사/유튜버(무료), company = 대형 기획사(SaaS 유료)
  agencyType: text("agency_type").notNull().default("solo"),
  plan: text("plan").notNull().default("free"), // free | growth | enterprise
  manager: text("manager"),
  phone: text("phone"),
  email: text("email"),
  logoUrl: text("logo_url"),
  verified: boolean("verified").notNull().default(false),
  // 소속사 인증 상태 — 셀프 가입 시 pending(심사 대기), 관리자 승인 시 verified
  verificationStatus: text("verification_status").notNull().default("pending"), // pending | verified | rejected
  businessDocUrl: text("business_doc_url"), // 사업자등록증 등 첨부 서류(Blob)
  businessNumber: text("business_number"), // 사업자등록번호 — OCR 자동 인식/수동 입력
  businessType: text("business_type"), // 업태·종목(OCR) — 대행사 위장 심사 단서
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const artists = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agencies.id),
  // 크리에이터 셀프 계정(카카오 로그인)과 연결 — 없으면 소속사가 등록한 아티스트
  userId: uuid("user_id").references(() => users.id),
  // 공개 프로필 URL(`/@슬러그`)·사이트맵 키 — 소속사 등록 시 자동 노출의 앵커
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  // 표시용 소속사명(비정규화) — 다중 소속사 정식 모델링 전까지 원본 유지
  agencyName: text("agency_name"),
  groupName: text("group_name"),
  categories: jsonb("categories").$type<string[]>().notNull().default([]),
  gender: text("gender"),
  tagline: text("tagline"),
  profile: text("profile"),
  imageUrl: text("image_url"), // WebP로 변환되어 저장
  galleryUrls: jsonb("gallery_urls").$type<string[]>().notNull().default([]),
  youtube: text("youtube"),
  instagram: text("instagram"),
  followers: integer("followers").notNull().default(0),
  responseRate: integer("response_rate").notNull().default(0), // 0-100
  responseHours: integer("response_hours").notNull().default(24),
  budgetMin: integer("budget_min"), // 만원
  budgetMax: integer("budget_max"), // 만원
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  recentWork: jsonb("recent_work").$type<string[]>().notNull().default([]),
  // 견적 프리셋 — 인박스 견적 회신 원클릭 채움
  presetFee: integer("preset_fee"), // 만원
  presetIncludes: text("preset_includes"),
  presetNote: text("preset_note"),
  // 소속사:아티스트 기본 분배율 (basis point, 3000 = 소속사 30%)
  defaultAgencyRateBp: integer("default_agency_rate_bp").notNull().default(3000),
  verified: boolean("verified").notNull().default(false),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const schedules = pgTable(
  "schedules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id),
    date: date("date").notNull(),
    availability: availability("availability").notNull().default("hold"),
    publicNote: text("public_note"),
    privateMemo: text("private_memo"), // 소속사만 열람
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("schedules_artist_date_unique").on(t.artistId, t.date)]
);

export const bookingRequests = pgTable("booking_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyUserId: uuid("company_user_id")
    .notNull()
    .references(() => users.id),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id),
  // 표시용 주최자 정보(비정규화) — 다중 광고주 정식 모델링 전까지 원본 유지
  companyName: text("company_name"),
  companyVerified: boolean("company_verified").notNull().default(false),
  companyEventCount: integer("company_event_count"),
  eventType: text("event_type").notNull(),
  budget: integer("budget").notNull(), // 만원
  location: text("location"),
  eventDate: date("event_date"),
  brief: jsonb("brief").$type<Record<string, string>>(), // 표준 브리프 (분량/독점/초상권 등)
  message: text("message"),
  source: text("source").notNull().default("platform"), // platform | ai_intake | email
  status: bookingStatus("status").notNull().default("pending"),
  // 어드밴싱 체크리스트 — 완료된 항목 라벨 목록
  advancing: jsonb("advancing").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 홀드(가일정) — 수락 시 자동 생성, 만료일까지 미확정이면 해제
export const holds = pgTable("holds", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id),
  date: date("date").notNull(),
  requestId: uuid("request_id").references(() => bookingRequests.id),
  companyName: text("company_name"),
  expiresAt: date("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 데일리 스케줄표 — 확정 일정의 실행 시트
export const daySchedules = pgTable("day_schedules", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id),
  date: date("date").notNull(),
  title: text("title").notNull(),
  eventType: text("event_type"),
  manager: text("manager"),
  vehicle: text("vehicle"),
  stops: jsonb("stops")
    .$type<{ time: string; label: string; location?: string }[]>()
    .notNull()
    .default([]),
  memo: text("memo"),
  broadcastAt: timestamp("broadcast_at"), // 카톡 전파 시각
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 휴가/개인 일정 — 아티스트 신청 → 소속사 승인 → 캘린더 불가 반영
export const leaveStatus = pgEnum("leave_status", [
  "pending",
  "approved",
  "rejected",
]);

export const leaves = pgTable("leaves", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: text("reason"),
  status: leaveStatus("status").notNull().default("pending"),
  decidedByUserId: uuid("decided_by_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 정산 — 분배율·원천징수·실지급액
export const settlementStatus = pgEnum("settlement_status", [
  "paid",
  "pending",
  "overdue",
]);

export const settlements = pgTable("settlements", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id")
    .notNull()
    .references(() => artists.id),
  requestId: uuid("request_id").references(() => bookingRequests.id),
  eventTitle: text("event_title").notNull(),
  eventDate: date("event_date"),
  gross: integer("gross").notNull(), // 만원
  agencyRateBp: integer("agency_rate_bp").notNull().default(3000), // basis point (3000 = 30%)
  status: settlementStatus("status").notNull().default("pending"),
  taxInvoice: boolean("tax_invoice").notNull().default(false),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 서류함 — 계약서/큐시트/공문/정산서
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id").references(() => agencies.id),
  artistId: uuid("artist_id").references(() => artists.id),
  requestId: uuid("request_id").references(() => bookingRequests.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // 계약서 | 큐시트 | 공문 | 정산서
  eventTitle: text("event_title"),
  fileUrl: text("file_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 매니저 — 담당 아티스트 배정, 권한 스코프
export const managers = pgTable("managers", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agencies.id),
  userId: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  role: text("role").notNull().default("로드매니저"), // 실장 | 팀장 | 로드매니저
  phone: text("phone"),
  artistIds: jsonb("artist_ids").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 상태 변경 감사 로그 — 분쟁 대비
export const bookingStatusHistory = pgTable("booking_status_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => bookingRequests.id),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 협의 스레드 — 협상이 서비스의 심장
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => bookingRequests.id),
  sender: messageSender("sender").notNull(),
  senderUserId: uuid("sender_user_id").references(() => users.id),
  senderName: text("sender_name"),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 견적은 협상 라운드마다 쌓인다
export const quotes = pgTable("quotes", {
  id: uuid("id").primaryKey().defaultRandom(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => bookingRequests.id),
  amount: integer("amount").notNull(), // 만원
  items: jsonb("items").$type<{ label: string; amount: number }[]>(),
  includes: text("includes"), // 기본 포함 항목 (예: 공연 30분 + 포토타임)
  note: text("note"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  accepted: boolean("accepted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  link: text("link"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- 오픈 캠페인 (역방향 캐스팅) ----------
// 광고주가 니즈를 공개하면 소속사/아티스트가 역으로 지원 → 선정 시 booking_requests로 전환.
export const campaignStatus = pgEnum("campaign_status", [
  "open", // 지원 접수 중
  "closed", // 마감(기한 경과/수동) — 지원 불가
  "awarded", // 선정 완료 → 부킹으로 전환됨
  "cancelled", // 취소
]);

export const campaigns = pgTable("campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyUserId: uuid("company_user_id")
    .notNull()
    .references(() => users.id),
  companyName: text("company_name"), // 비정규화 표시용
  title: text("title").notNull(),
  eventType: text("event_type").notNull(), // 유튜브 협업 | 행사 MC | 브랜드 앰배서더 | 광고 촬영 ...
  categories: jsonb("categories").$type<string[]>().notNull().default([]), // 원하는 아티스트 카테고리(매칭)
  budgetMin: integer("budget_min"), // 만원
  budgetMax: integer("budget_max"), // 만원
  location: text("location"),
  eventDate: date("event_date"), // 예정 시기(협의 가능이면 null)
  deadline: date("deadline").notNull(), // 지원 마감일(기한)
  description: text("description"),
  imageUrl: text("image_url"), // 브랜드·레퍼런스 이미지(선택, WebP)
  brief: jsonb("brief").$type<Record<string, string>>(), // 조건(분량/독점/초상권)
  status: campaignStatus("status").notNull().default("open"),
  awardedApplicationId: uuid("awarded_application_id"), // 선정된 지원(순환참조 피해 FK 생략)
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const applicationStatus = pgEnum("application_status", [
  "applied", // 지원함
  "shortlisted", // 후보(관심)
  "selected", // 최종 선정
  "rejected", // 미선정
  "withdrawn", // 지원 철회
]);

export const campaignApplications = pgTable(
  "campaign_applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id),
    artistId: uuid("artist_id")
      .notNull()
      .references(() => artists.id),
    agencyId: uuid("agency_id").references(() => agencies.id),
    applicantUserId: uuid("applicant_user_id").references(() => users.id),
    pitch: text("pitch"), // 제안 메시지 — "왜 우리 아티스트가 적합한지"
    proposedFee: integer("proposed_fee"), // 만원(선택)
    proposedIncludes: text("proposed_includes"),
    status: applicationStatus("status").notNull().default("applied"),
    requestId: uuid("request_id").references(() => bookingRequests.id), // 선정 시 생성된 부킹
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("campaign_app_unique").on(t.campaignId, t.artistId)]
);

// ---------- 아웃리치 (콜드메일 캠페인) ----------
// 매출 원천이 소속사 SaaS이므로 아웃리치도 제품의 일부 — 관리자 전용.

export const outreachSegment = pgEnum("outreach_segment", [
  "agency", // 엔터 기획사 (최우선)
  "creator", // 유튜버·크리에이터
  "company", // 중견기업 이상 (행사·마케팅)
]);

export const outreachStatus = pgEnum("outreach_status", [
  "queued", // 발송 대기
  "sending", // 선점됨(발송 중) — 동시 발송 방지용 원자적 클레임 상태
  "sent", // 1차 발송됨
  "opened", // 열람 확인
  "replied", // 답장 옴 → 더 이상 자동발송 없음
  "bounced", // 반송 → 재발송 금지
  "unsubscribed", // 수신거부 → 영구 제외
  "failed", // 발송 실패
]);

export const outreachContacts = pgTable("outreach_contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"), // 담당자명 (없으면 조직명으로 호칭)
  org: text("org"), // 회사·채널명
  segment: outreachSegment("segment").notNull(),
  // 엔터=100 > 유튜버=50 > 기업=10 — 발송 큐 정렬 기준
  priority: integer("priority").notNull().default(0),
  status: outreachStatus("status").notNull().default("queued"),
  unsubToken: uuid("unsub_token").notNull().defaultRandom().unique(),
  sentCount: integer("sent_count").notNull().default(0), // 최대 2 (1차 + 리마인드)
  lastSentAt: timestamp("last_sent_at"),
  resendMessageId: text("resend_message_id"), // 웹훅 이벤트 매칭용
  note: text("note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const outreachReplyStatus = pgEnum("outreach_reply_status", [
  "pending", // AI 초안 생성됨 — 승인 대기
  "approved", // 관리자가 승인·발송 완료
  "dismissed", // 무시 (스팸·자동응답 등)
]);

export const outreachReplies = pgTable("outreach_replies", {
  id: uuid("id").primaryKey().defaultRandom(),
  contactId: uuid("contact_id").references(() => outreachContacts.id),
  fromEmail: text("from_email").notNull(),
  subject: text("subject"),
  body: text("body").notNull(), // 수신 원문 (text)
  intent: text("intent"), // interested | question | rejected | meeting | other
  summary: text("summary"), // AI 한줄 요약
  draft: text("draft"), // AI 답장 초안 (관리자 수정 가능)
  status: outreachReplyStatus("status").notNull().default("pending"),
  sentReply: text("sent_reply"), // 실제 발송된 답장
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
