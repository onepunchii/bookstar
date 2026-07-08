import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";
import { upsertKakaoUser } from "@/lib/data/upsert-user";

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
    async jwt({ token, account, profile }) {
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
