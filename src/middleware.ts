export { auth as middleware } from "@/auth";

// 페이지 보호만 미들웨어로(미인증 → /login 리다이렉트).
// 쓰기 API는 각 라우트에서 401을 반환한다(fetch가 리다이렉트를 성공으로 오인하지 않게).
export const config = {
  matcher: ["/agency/:path*", "/me/:path*"],
};
