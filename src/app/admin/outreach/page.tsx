// 아웃리치 관리 콘솔 — 대상 등록 → 발송 → 답장함(AI 초안 승인) 파이프라인.
// users.role='admin' 계정만 접근 가능.
import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { requireAdmin } from "@/lib/data/admin";
import { AdminGate } from "../admin-gate";
import { OutreachConsole } from "./outreach-console";

export const dynamic = "force-dynamic";

export default async function OutreachAdminPage() {
  if (!(await requireAdmin())) return <AdminGate />;

  const db = getDb();
  const [stats, pendingReplies] = await Promise.all([
    db
      .select({
        segment: schema.outreachContacts.segment,
        status: schema.outreachContacts.status,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.outreachContacts)
      .groupBy(schema.outreachContacts.segment, schema.outreachContacts.status),
    db
      .select()
      .from(schema.outreachReplies)
      .where(eq(schema.outreachReplies.status, "pending"))
      .orderBy(desc(schema.outreachReplies.createdAt))
      .limit(50),
  ]);

  return (
    <OutreachConsole
      stats={stats}
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
    />
  );
}
