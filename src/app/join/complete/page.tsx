import { Suspense } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { CompleteInner } from "./complete-inner";

export const metadata = {
  title: "가입 완료 · xong",
};

export default function JoinCompletePage() {
  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="xong 홈으로">
            <Wordmark height={20} />
          </Link>
          <Link href="/" className="text-xs font-semibold text-neutral-500">
            대시보드로 이동 →
          </Link>
        </div>
      </header>
      <Suspense fallback={null}>
        <CompleteInner />
      </Suspense>
    </div>
  );
}
