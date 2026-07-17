import { NextResponse } from "next/server";
import { appleSelfTest } from "@/lib/apple-revoke";

// 임시 진단 — Apple revoke 설정 유효성 점검(비밀 미노출). 확인 후 삭제.
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json(await appleSelfTest());
}
