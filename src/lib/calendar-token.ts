// 캘린더 구독 피드(.ics) 접근 토큰 — 공개 slug/uuid 추측으로 내부 시트가 새지 않게
// artistId를 AUTH_SECRET으로 HMAC 서명한다. 소속사가 콘솔에서 복사한 URL만 유효.
import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  return process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "xong-cal";
}

export function signCalendarToken(artistId: string): string {
  return createHmac("sha256", secret())
    .update(`cal:${artistId}`)
    .digest("base64url")
    .slice(0, 24);
}

export function verifyCalendarToken(
  artistId: string,
  token: string | null | undefined
): boolean {
  if (!token) return false;
  const expected = signCalendarToken(artistId);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
