// 아웃리치 대상 관리 — POST: 일괄 등록(중복 무시), GET: 현황 집계. 관리자 전용.
import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { getDb, schema } from "@/lib/db";
import { getSessionUser } from "@/lib/data/session";

const PRIORITY: Record<string, number> = { agency: 100, creator: 50, company: 10 };
const SEGMENTS = ["agency", "creator", "company"] as const;

async function requireAdmin() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") return null;
  return user;
}

export async function POST(req: Request) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "관리자 전용" }, { status: 403 });
  }
  const body = (await req.json()) as {
    rows?: { email?: string; name?: string; org?: string; segment?: string }[];
  };
  const rows = (body.rows ?? [])
    .filter(
      (r): r is { email: string; name?: string; org?: string; segment: string } =>
        typeof r.email === "string" &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email.trim()) &&
        SEGMENTS.includes(r.segment as (typeof SEGMENTS)[number])
    )
    .map((r) => ({
      email: r.email.trim().toLowerCase(),
      name: r.name?.trim() || null,
      org: r.org?.trim() || null,
      segment: r.segment as (typeof SEGMENTS)[number],
      priority: PRIORITY[r.segment] ?? 0,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ inserted: 0, skipped: 0 });
  }

  const db = getDb();
  const inserted = await db
    .insert(schema.outreachContacts)
    .values(rows)
    .onConflictDoNothing({ target: schema.outreachContacts.email })
    .returning({ id: schema.outreachContacts.id });

  return NextResponse.json({
    inserted: inserted.length,
    skipped: rows.length - inserted.length,
  });
}

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "관리자 전용" }, { status: 403 });
  }
  const db = getDb();
  const stats = await db
    .select({
      segment: schema.outreachContacts.segment,
      status: schema.outreachContacts.status,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.outreachContacts)
    .groupBy(schema.outreachContacts.segment, schema.outreachContacts.status);

  const recent = await db
    .select()
    .from(schema.outreachContacts)
    .orderBy(desc(schema.outreachContacts.createdAt))
    .limit(30);

  return NextResponse.json({ stats, recent });
}
