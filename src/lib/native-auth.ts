import "server-only";
import { createRemoteJWKSet, jwtVerify } from "jose";

// 네이티브 앱(Capacitor) 로그인 토큰 서버 검증 — onp/mapix 검증 패턴.
// 카카오: 앱의 카카오 SDK가 받은 access_token을 카카오 서버에 직접 조회(위조 불가).
// 애플: iOS 네이티브 SIWA id_token — aud가 번들 ID(kr.co.xong.app)라 Services ID 불필요.

export async function verifyKakaoAccessToken(
  accessToken: string
): Promise<{ kakaoId: string; nickname: string } | null> {
  try {
    const res = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const p = (await res.json()) as {
      id?: number | string;
      properties?: { nickname?: string };
      kakao_account?: { profile?: { nickname?: string } };
    };
    if (!p.id) return null;
    const nickname =
      p.properties?.nickname ?? p.kakao_account?.profile?.nickname ?? "회원";
    return { kakaoId: String(p.id), nickname };
  } catch {
    return null;
  }
}

const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

export async function verifyAppleIdToken(idToken: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
      issuer: "https://appleid.apple.com",
      audience: process.env.APPLE_BUNDLE_ID ?? "kr.co.xong.app",
    });
    return (payload.sub as string) ?? null;
  } catch {
    return null;
  }
}
