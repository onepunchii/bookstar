// 브라우저 → /api/errors 전송. 세션 내 중복 억제 + 상한선.
const sent = new Set<string>();
let budget = 20; // 한 세션에서 보낼 수 있는 최대 건수

export function reportClientError(
  message: string,
  stack?: string | null,
  digest?: string | null
) {
  try {
    if (!message || budget <= 0) return;
    const key = `${message}|${(stack ?? "").slice(0, 120)}`;
    if (sent.has(key)) return;
    sent.add(key);
    budget--;

    fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        stack: stack ?? undefined,
        digest: digest ?? undefined,
        url: typeof location !== "undefined" ? location.pathname : undefined,
      }),
      keepalive: true, // 페이지가 닫혀도 전송 시도
    }).catch(() => {});
  } catch {
    /* 리포터가 에러를 만들면 안 된다 */
  }
}
