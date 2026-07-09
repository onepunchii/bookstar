"use server";

import { signIn } from "@/auth";

// 카카오 로그인 — 모달에서 폼 액션으로 호출. redirectTo로 원위치 복귀.
export async function kakaoSignIn(formData: FormData) {
  const redirectTo = String(formData.get("redirectTo") || "/");
  await signIn("kakao", { redirectTo });
}
