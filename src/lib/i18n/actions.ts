"use server";

// 언어 변경 서버 액션 — 쿠키를 저장하면 Next가 현재 트리를 재렌더해 서버 컴포넌트 문구가 즉시 바뀐다.
import { cookies } from "next/headers";
import { COOKIE_NAME, COOKIE_MAX_AGE, isLocale } from "./locales";

export async function setLocaleAction(locale: string): Promise<void> {
  if (!isLocale(locale)) return;
  (await cookies()).set(COOKIE_NAME, locale, {
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}
