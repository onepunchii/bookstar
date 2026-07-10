"use client";

// 페이지 단위 에러 바운더리 — 사용자에겐 복구 버튼, 관리자에겐 수집.
import { useEffect } from "react";
import Link from "next/link";
import { reportClientError } from "@/lib/report-client-error";
import { RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // digest가 있으면 서버 에러 → instrumentation이 이미 수집했다(중복 방지)
    if (!error.digest) reportClientError(error.message, error.stack);
  }, [error]);

  return (
    <div className="adv-dark flex min-h-[70dvh] items-center justify-center px-5">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-500">
          Error
        </p>
        <h1 className="display-kr mt-3 text-2xl font-black text-white sm:text-3xl">
          문제가 생겼어요
        </h1>
        <p className="mt-2.5 text-sm leading-relaxed text-white/50">
          잠시 후 다시 시도해 주세요. 오류는 자동으로 접수돼 확인하고 있어요.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-white/25">
            {error.digest}
          </p>
        )}
        <div className="mt-8 flex items-center justify-center gap-2.5">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-400"
          >
            <RotateCcw className="h-4 w-4" />
            다시 시도
          </button>
          <Link
            href="/"
            className="rounded-xl bg-white/8 px-5 py-2.5 text-sm font-bold text-white/80 hover:bg-white/12"
          >
            홈으로
          </Link>
        </div>
      </div>
    </div>
  );
}
