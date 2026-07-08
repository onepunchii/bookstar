import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDb, schema } from "@/lib/db";

// 내 계정(광고주) 프로필 수정 — 이름·회사명·개인/기업 구분·연락처.
interface Body {
  name?: string;
  company?: string | null;
  accountType?: "personal" | "business";
  phone?: string | null;
}

export async function POST(req: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid || !/^[0-9a-f-]{36}$/.test(uid)) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }
  try {
    const b = (await req.json()) as Body;
    const patch: Partial<typeof schema.users.$inferInsert> = {};
    if (b.name?.trim()) patch.name = b.name.trim();
    if (b.company !== undefined) patch.company = b.company?.trim() || null;
    if (b.accountType === "personal" || b.accountType === "business")
      patch.accountType = b.accountType;
    if (b.phone !== undefined) patch.phone = b.phone?.trim() || null;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ error: "변경 없음" }, { status: 400 });
    }
    const db = getDb();
    await db.update(schema.users).set(patch).where(eq(schema.users.id, uid));
    revalidatePath("/account");
    revalidatePath("/");
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[me profile]", e);
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}
