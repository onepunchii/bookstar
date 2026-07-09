// 크리에이터 미등록 게이트 — 등록 전엔 /me 어느 탭이든 안내 노출.
import Link from "next/link";
import { ArrowRight, Sparkles, UserRound } from "lucide-react";

const FEATURES = "내 일정 · 휴가 신청 · 정산 · 공개 프로필";

export function MeGate() {
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white">
        <UserRound className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-black text-neutral-900">
        크리에이터로 시작하세요
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        소속사 없이 활동 중이신가요? 3분이면 나만의 섭외 링크가 발급돼요.
      </p>
      <p className="mt-1.5 text-xs font-medium text-brand-600">
        등록하면 {FEATURES} 를 한 곳에서 관리할 수 있어요.
      </p>

      <Link
        href="/join/creator"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" /> 크리에이터 등록하기{" "}
        <ArrowRight className="h-4 w-4" />
      </Link>
      <div className="mt-4">
        <Link
          href="/"
          className="text-sm font-semibold text-neutral-400 hover:text-neutral-700"
        >
          광고주 홈으로 둘러보기
        </Link>
      </div>
    </div>
  );
}
