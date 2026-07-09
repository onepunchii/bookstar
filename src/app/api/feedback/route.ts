import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";
import { notify } from "@/lib/data/notify";

const UUID = /^[0-9a-f-]{36}$/;
const CATEGORIES = new Set(["제휴", "버그", "개선", "기타"]);

// 건의 접수 — 비로그인도 허용(연락처 선택), 로그인 시 계정 자동 연결.
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as {
      role?: string;
      category?: string;
      body?: string;
      contact?: string;
    };
    const body = b.body?.trim();
    if (!body || body.length < 5)
      return NextResponse.json(
        { error: "내용을 5자 이상 적어주세요" },
        { status: 400 }
      );
    if (body.length > 2000)
      return NextResponse.json({ error: "2000자 이내로 적어주세요" }, { status: 400 });
    const category = CATEGORIES.has(b.category ?? "") ? b.category! : "기타";
    const role = b.role === "agency" ? "agency" : "company";

    const session = await auth();
    const uid = session?.user?.id;
    const userId = uid && UUID.test(uid) ? uid : null;

    const db = getDb();
    await db.insert(schema.feedbacks).values({
      userId,
      role,
      category,
      body,
      contact: b.contact?.trim() || null,
    });

    // 관리자에게 알림
    try {
      const admins = await db
        .select({ id: schema.users.id })
        .from(schema.users)
        .where(eq(schema.users.role, "admin"));
      for (const a of admins) {
        await notify(a.id, {
          type: "feedback",
          title: `새 건의 · ${category}`,
          body: body.slice(0, 60),
          link: "/admin/feedback",
        });
      }
    } catch {
      /* 알림 실패해도 접수는 유지 */
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[feedback]", e);
    return NextResponse.json({ error: "접수에 실패했어요" }, { status: 500 });
  }
}
