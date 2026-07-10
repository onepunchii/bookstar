"use client";

// 클라이언트 런타임 에러 수집 — 전역 window 리스너.
// 세션 내 중복은 보내지 않는다(무한 루프 나는 컴포넌트가 서버를 때리지 않도록).
import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client-error";

export function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      reportClientError(e.message, e.error?.stack);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason;
      reportClientError(
        r instanceof Error ? r.message : `Unhandled rejection: ${String(r)}`,
        r instanceof Error ? r.stack : undefined
      );
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
