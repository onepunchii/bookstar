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
