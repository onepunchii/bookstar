"use client";

import { Printer } from "lucide-react";

/**
 * 브라우저 인쇄 대화상자 — "대상: PDF로 저장"으로 파일이 나온다.
 * iOS Safari도 공유 시트에서 인쇄 → 미리보기 확대 → 저장으로 PDF가 된다.
 */
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex h-10 items-center gap-2 rounded-lg bg-neutral-900 px-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
    >
      <Printer className="h-4 w-4" />
      {label}
    </button>
  );
}
