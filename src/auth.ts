import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import Credentials from "next-auth/providers/credentials";
import { upsertKakaoUser } from "@/lib/data/upsert-user";
import { verifyKakaoAccessToken, verifyAppleIdToken } from "@/lib/native-auth";

// Auth.js(NextAuth v5) — 카카오 OAuth.
// 보호 경로: /agency(소속사 콘솔), /me(아티스트), /api/artists/*(쓰기 API).
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
      // 기본 authorization은 문자열 URL이라 params만 덮으면 URL이 사라짐 → 전체 지정.
      // 닉네임만 요청(이메일 동의는 비즈앱 심사 필요).
      authorization: {
        url: "https://kauth.kakao.com/oauth/authorize",
        params: { scope: "profile_nickname" },
      },
    }),
    // "native" = 네이티브 앱(Capacitor) 전용 로그인 (onp/mapix 검증 패턴).
    // 카카오: Android 카카오톡 SDK가 받은 access_token을 서버가 kapi로 검증.
    // 애플: iOS SIWA id_token(aud=번들ID) 검증 — App Store 4.8 의무 대응.
    // 웹/PWA는 위 Kakao OAuth 그대로 — 이 provider 안 탐.
    Credentials({
      id: "native",
      name: "native",
      credentials: { provider: {}, accessToken: {}, idToken: {} },
      async authorize(cred) {
        const provider = String(cred?.provider ?? "");
        if (provider === "kakao") {
          const info = await verifyKakaoAccessToken(String(cred?.accessToken ?? ""));
          if (!info) return null;
          const dbUser = await upsertKakaoUser(info.kakaoId, info.nickname);
          return { id: dbUser.id, name: info.nickname, uid: dbUser.id, role: dbUser.role } as never;
        }
        if (provider === "apple") {
          const sub = await verifyAppleIdToken(String(cred?.idToken ?? ""));
          if (!sub) return null;
          // kakaoId unique 컬럼을 provider 식별자로 재활용 — "apple:{sub}"
          const dbUser = await upsertKakaoUser(`apple:${sub}`, "Apple 사용자");
          return { id: dbUser.id, name: "Apple 사용자", uid: dbUser.id, role: dbUser.role } as never;
        }
        return null;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // 미들웨어가 호출 — 보호 경로는 세션 필수
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isProtected =
        pathname.startsWith("/agency") ||
        pathname.startsWith("/me") ||
        pathname.startsWith("/api/artists");
      if (isProtected) return !!auth?.user;
      return true;
    },
    // 최초 로그인 시 카카오 유저를 users에 upsert → DB id·role을 토큰에 저장
    async jwt({ token, account, profile, user }) {
      // native(Credentials) 로그인 — authorize가 이미 upsert 완료, uid/role만 토큰에 반영
      if (account?.provider === "native" && user) {
        const u = user as { uid?: string; role?: string };
        if (u.uid) token.uid = u.uid;
        if (u.role) token.role = u.role;
        return token;
      }
      if (account && profile) {
        const kakaoId = String(
          (profile as { id?: number | string }).id ?? token.sub
        );
        const acc = profile as {
          properties?: { nickname?: string };
          kakao_account?: { profile?: { nickname?: string } };
        };
        const name =
          acc.kakao_account?.profile?.nickname ??
          acc.properties?.nickname ??
          "사용자";
        try {
          const dbUser = await upsertKakaoUser(kakaoId, name);
          token.uid = dbUser.id;
          token.role = dbUser.role;
        } catch (e) {
          // DB 실패해도 로그인은 유지하되, 원인은 로그로 남긴다(무음 실패 방지)
          console.error("[auth] upsertKakaoUser 실패", {
            kakaoId,
            name,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        // DB users.id 우선, 없으면 카카오 sub
        session.user.id = (token.uid as string) ?? token.sub;
        if (token.role) session.user.role = token.role as string;
      }
      return session;
    },
  },
});
