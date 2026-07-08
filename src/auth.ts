import NextAuth from "next-auth";
import Kakao from "next-auth/providers/kakao";

// Auth.js(NextAuth v5) — 카카오 OAuth.
// 보호 경로: /agency(소속사 콘솔), /me(아티스트), /api/artists/*(쓰기 API).
export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Kakao({
      clientId: process.env.KAKAO_CLIENT_ID,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
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
    session({ session, token }) {
      if (token.sub && session.user) session.user.id = token.sub;
      return session;
    },
  },
});
