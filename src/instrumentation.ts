// Next.js 서버 런타임 에러 훅 — 서버 컴포넌트·라우트 핸들러·미들웨어에서 던져진
// 처리되지 않은 에러가 전부 여기로 온다. /admin/errors에서 확인.
export async function onRequestError(
  error: unknown,
  request: { path?: string; method?: string; headers?: Record<string, string> },
  context: { routePath?: string; routeType?: string; renderSource?: string }
) {
  try {
    const { captureError } = await import("@/lib/error-log");
    const err = error as { message?: string; stack?: string; digest?: string };
    await captureError({
      source: "server",
      message: err?.message ?? String(error),
      stack: err?.stack ?? null,
      digest: err?.digest ?? null,
      url: request.path ?? context.routePath ?? null,
      method: request.method ?? context.renderSource ?? null,
      userAgent: request.headers?.["user-agent"] ?? null,
    });
  } catch {
    /* 수집 실패가 요청을 죽이지 않도록 */
  }
}
