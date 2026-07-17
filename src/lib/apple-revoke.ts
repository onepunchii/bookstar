// Sign in with Apple — 토큰 교환·리보크 (App Store 5.1.1(v) 계정 삭제 요건).
// 서버 전용. env(.p8 키 등) 없으면 null/false로 graceful — 삭제 흐름은 계속된다.
// env: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY(.p8 본문), APPLE_CLIENT_ID(번들ID)
import { SignJWT, importPKCS8 } from "jose";

const CLIENT_ID = () => process.env.APPLE_CLIENT_ID || "kr.co.xong.app";

function appleConfigured(): boolean {
  return !!(
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    process.env.APPLE_PRIVATE_KEY
  );
}

// Apple에 보낼 client_secret (ES256 서명 JWT, 최대 6개월 — 여기선 5분)
async function makeClientSecret(): Promise<string | null> {
  if (!appleConfigured()) return null;
  try {
    // 환경변수에 개행이 \n 로 저장된 경우 복원
    const pem = (process.env.APPLE_PRIVATE_KEY as string).replace(/\\n/g, "\n");
    const key = await importPKCS8(pem, "ES256");
    const now = Math.floor(Date.now() / 1000);
    return await new SignJWT({})
      .setProtectedHeader({ alg: "ES256", kid: process.env.APPLE_KEY_ID })
      .setIssuer(process.env.APPLE_TEAM_ID as string)
      .setIssuedAt(now)
      .setExpirationTime(now + 300)
      .setAudience("https://appleid.apple.com")
      .setSubject(CLIENT_ID())
      .sign(key);
  } catch (e) {
    console.error("[apple] client_secret 서명 실패", e instanceof Error ? e.message : e);
    return null;
  }
}

// 로그인 시 authorization code → refresh_token 교환(리보크용으로 저장).
export async function exchangeAppleCode(
  code: string
): Promise<string | null> {
  const secret = await makeClientSecret();
  if (!secret || !code) return null;
  try {
    const body = new URLSearchParams({
      client_id: CLIENT_ID(),
      client_secret: secret,
      code,
      grant_type: "authorization_code",
    });
    const res = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[apple] token 교환 실패", res.status, await res.text());
      return null;
    }
    const j = (await res.json()) as { refresh_token?: string };
    return j.refresh_token ?? null;
  } catch (e) {
    console.error("[apple] token 교환 오류", e instanceof Error ? e.message : e);
    return null;
  }
}

// 계정 삭제 시 refresh_token 리보크 → Apple ID 설정에서 앱 연결 해제.
export async function revokeAppleToken(
  refreshToken: string | null | undefined
): Promise<boolean> {
  if (!refreshToken) return false;
  const secret = await makeClientSecret();
  if (!secret) return false;
  try {
    const body = new URLSearchParams({
      client_id: CLIENT_ID(),
      client_secret: secret,
      token: refreshToken,
      token_type_hint: "refresh_token",
    });
    const res = await fetch("https://appleid.apple.com/auth/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error("[apple] revoke 실패", res.status, await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("[apple] revoke 오류", e instanceof Error ? e.message : e);
    return false;
  }
}
