import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteAccount } from "@/lib/data/delete-account";
import { revokeAppleToken } from "@/lib/apple-revoke";
import { sessionUserExists } from "@/lib/data/session";

const UUID = /^[0-9a-f-]{36}$/;

// 계정 영구 삭제 — 로그인 필수 + 확인 문구("삭제"). 데이터 전체 삭제 + Apple 토큰 리보크.
export async function POST(req: Request) {
  const session = await auth();
  const uid = session?.user?.id;
  if (!uid || !UUID.test(uid))
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  if (!(await sessionUserExists(uid)))
    return NextResponse.json({ error: "이미 삭제된 계정입니다" }, { status: 401 });

  // 오삭제 방지 — 클라이언트가 확인 문구를 명시적으로 보내야 함
  const b = (await req.json().catch(() => ({}))) as { confirm?: string };
  if (b?.confirm !== "삭제")
    return NextResponse.json(
      { error: "확인 문구가 필요합니다" },
      { status: 400 }
    );

  try {
    const { appleRefreshToken } = await deleteAccount(uid);
    // Apple ID 설정에서 앱 연결 해제 (키 설정 시에만 실제 호출)
    if (appleRefreshToken) {
      try {
        await revokeAppleToken(appleRefreshToken);
      } catch {
        /* 리보크 실패해도 데이터 삭제는 완료됨 */
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[account delete]", e);
    return NextResponse.json(
      { error: "삭제 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}
