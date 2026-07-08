// 아웃리치 관리 콘솔 — 대상 등록 → 발송 → 답장함(AI 초안 승인) 파이프라인.
// users.role='admin' 계정만 접근 가능.
import { desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/data/session";
import { OutreachConsole } from "./outreach-console";

export const dynamic = "force-dynamic";

export default async function OutreachAdminPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="text-xl font-black tracking-tight">관리자 전용</h1>
        <p className="mt-3 text-sm text-neutral-500">
          카카오 로그인 후, DB에서 내 계정의 <code>users.role</code>을{" "}
          <code>admin</code>으로 바꾸면 접근할 수 있습니다.
        </p>
      </div>
    );
  }

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
