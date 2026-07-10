"use client";

// 루트 레이아웃까지 터졌을 때의 최후 바운더리 — 자체 html/body를 렌더해야 한다.
import { useEffect } from "react";
import { reportClientError } from "@/lib/report-client-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (!error.digest) reportClientError(error.message, error.stack);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          background: "#0a0a0b",
          color: "#fff",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ textAlign: "center", maxWidth: 380 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.15em",
              color: "#ff5a00",
              margin: 0,
            }}
          >
            ERROR
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: "12px 0 0" }}>
            화면을 불러오지 못했어요
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.5)",
              margin: "10px 0 0",
            }}
          >
            오류는 자동으로 접수됐어요. 새로고침하면 대부분 해결됩니다.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 28,
              border: 0,
              borderRadius: 12,
              background: "#ff5a00",
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              padding: "10px 20px",
              cursor: "pointer",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}
