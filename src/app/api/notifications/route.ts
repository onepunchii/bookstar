import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { demoUserForRole } from "@/lib/data/notify";

// 알림 조회/읽음 처리. 로그인 유저는 본인, 데모는 역할 시드 유저 기준.
async function resolveUserId(role?: string | null): Promise<string | null> {
  const session = await auth();
  if (session?.user?.id) {
    // 카카오 로그인 유저의 DB id (uuid 형태일 때만)
    if (/^[0-9a-f-]{36}$/.test(session.user.id)) return session.user.id;
  }
  if (role === "company" || role === "agency" || role === "artist") {
    return demoUserForRole(role);
  }
  return null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = await resolveUserId(searchParams.get("role"));
  if (!userId) return NextResponse.json({ items: [] });
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.notifications)
      .where(eq(schema.notifications.userId, userId))
      .orderBy(desc(schema.notifications.createdAt))
      .limit(30);
    return NextResponse.json({
      items: rows.map((r) => ({
        id: r.id,
        type: r.type,
        title: r.title,
        body: r.body ?? "",
        link: r.link ?? undefined,
        createdAt: r.createdAt.toISOString(),
        readAt: r.readAt?.toISOString(),
      })),
    });
  } catch {
    return NextResponse.json({ items: [] });
  }
}

export async function PATCH(req: Request) {
  try {
    const b = (await req.json()) as {
      ids?: string[];
      all?: boolean;
      role?: string;
    };
    // 읽음 처리(쓰기)는 실제 로그인 세션만 — 익명 role 폴백으로 시드 알림을 건드리지 못하게
    const session = await auth();
    const uid = session?.user?.id;
    const userId = uid && /^[0-9a-f-]{36}$/.test(uid) ? uid : null;
    if (!userId) return NextResponse.json({ ok: true });
    const db = getDb();
    if (b.all) {
      await db
        .update(schema.notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(schema.notifications.userId, userId),
            isNull(schema.notifications.readAt)
          )
        );
    } else if (b.ids?.length) {
      await db
        .update(schema.notifications)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(schema.notifications.userId, userId),
            inArray(schema.notifications.id, b.ids)
          )
        );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
