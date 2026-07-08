// 아웃리치 관리 콘솔 — 검토 중심 4탭: 대시보드(다음 발송 미리보기) · 템플릿 · 연락처 · 답장함.
// users.role='admin' 계정만 접근 가능.
import { and, asc, desc, eq, inArray, lt, ne, or, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/data/admin";
import {
  buildOutreachEmail,
  getSegmentCopy,
  type OutreachSegment,
} from "@/lib/outreach/templates";
import { AdminGate } from "../admin-gate";
import { OutreachConsole } from "./outreach-console";

export const dynamic = "force-dynamic";

const SEGMENTS: OutreachSegment[] = ["agency", "creator", "company"];
const REMIND_AFTER_MS = 4 * 24 * 60 * 60 * 1000;
const STALE_SENDING_MS = 15 * 60 * 1000;

// 미리보기용 샘플 수신자 — 실제 치환이 어떻게 보이는지 확인용
const PREVIEW_SAMPLE: Record<
  OutreachSegment,
  { name: string | null; org: string | null }
> = {
  agency: { name: null, org: "샘플엔터테인먼트" },
  creator: { name: "크리에이터", org: null },
  company: { name: null, org: "샘플마케팅" },
};

export default async function OutreachAdminPage() {
  if (!(await requireAdmin())) return <AdminGate />;

  const db = getDb();
  const remindBefore = new Date(Date.now() - REMIND_AFTER_MS);
  const staleBefore = new Date(Date.now() - STALE_SENDING_MS);

  const [stats, nextBatch, recentContacts, pendingReplies, processedReplies] =
    await Promise.all([
      db
        .select({
          segment: schema.outreachContacts.segment,
          status: schema.outreachContacts.status,
          count: sql<number>`count(*)::int`,
        })
        .from(schema.outreachContacts)
        .groupBy(schema.outreachContacts.segment, schema.outreachContacts.status),
      // 발송 라우트와 동일한 후보 조건 — "지금 발송하면 누구에게 나가는가"
      db
        .select()
        .from(schema.outreachContacts)
        .where(
          or(
            eq(schema.outreachContacts.status, "queued"),
            and(
              inArray(schema.outreachContacts.status, ["sent", "opened"]),
              eq(schema.outreachContacts.sentCount, 1),
              lt(schema.outreachContacts.lastSentAt, remindBefore)
            ),
            and(
              eq(schema.outreachContacts.status, "sending"),
              lt(schema.outreachContacts.lastSentAt, staleBefore)
            )
          )
        )
        .orderBy(
          desc(schema.outreachContacts.priority),
          asc(schema.outreachContacts.createdAt)
        )
        .limit(40),
      db
        .select()
        .from(schema.outreachContacts)
        .orderBy(desc(schema.outreachContacts.createdAt))
        .limit(200),
      db
        .select()
        .from(schema.outreachReplies)
        .where(eq(schema.outreachReplies.status, "pending"))
        .orderBy(desc(schema.outreachReplies.createdAt))
        .limit(50),
      db
        .select()
        .from(schema.outreachReplies)
        .where(ne(schema.outreachReplies.status, "pending"))
        .orderBy(desc(schema.outreachReplies.createdAt))
        .limit(10),
    ]);

  // 템플릿 미리보기 — 세그먼트별 실제 HTML + 제목 A/B (더미 토큰)
  const templates = SEGMENTS.map((seg) => {
    const copy = getSegmentCopy(seg);
    const built = buildOutreachEmail(seg, {
      ...PREVIEW_SAMPLE[seg],
      unsubToken: "00000000-0000-0000-0000-000000000000",
    });
    return {
      segment: seg,
      subjects: copy.subjects,
      reminderSubject: copy.reminderSubject,
      preheader: copy.preheader,
      ctaPath: copy.ctaPath,
      html: built.html,
    };
  });

  const toContact = (c: (typeof recentContacts)[number]) => ({
    id: c.id,
    email: c.email,
    name: c.name,
    org: c.org,
    segment: c.segment,
    status: c.status,
    sentCount: c.sentCount,
    lastSentAt: c.lastSentAt ? c.lastSentAt.toISOString() : null,
    createdAt: c.createdAt.toISOString(),
  });

  return (
    <OutreachConsole
      stats={stats}
      nextBatch={nextBatch.map(toContact)}
      contacts={recentContacts.map(toContact)}
      templates={templates}
      pendingReplies={pendingReplies.map((r) => ({
        id: r.id,
        fromEmail: r.fromEmail,
        subject: r.subject,
        body: r.body,
        intent: r.intent,
        summary: r.summary,
        draft: r.draft,
        createdAt: r.createdAt.toISOString(),
      }))}
      processedReplies={processedReplies.map((r) => ({
        id: r.id,
        fromEmail: r.fromEmail,
        intent: r.intent,
        summary: r.summary,
        status: r.status,
        sentAt: r.sentAt ? r.sentAt.toISOString() : null,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
