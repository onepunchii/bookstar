"use client";

// 둘러보기(데모) 모드 배너 — 소속사 콘솔 상단. 샘플 데이터임을 알리고 종료 제공.
import { useRouter } from "next/navigation";
import { Eye, X } from "lucide-react";

export function DemoBanner() {
  const router = useRouter();
  const exit = () => {
    try {
      document.cookie = "xong-demo=; path=/; max-age=0; SameSite=Lax";
    } catch {}
    router.push("/");
  };
  return (
    <div className="mb-5 flex flex-wrap items-center gap-2 rounded-xl bg-brand-50 px-4 py-2.5 text-sm ring-1 ring-brand-200">
      <Eye className="h-4 w-4 shrink-0 text-brand-600" />
      <span className="font-bold text-brand-700">둘러보기 모드</span>
      <span className="text-neutral-600">
        샘플 데이터로 소속사 콘솔 전체를 확인할 수 있어요. 로그인하면 실제
        데이터로 시작됩니다.
      </span>
      <button
        onClick={exit}
        className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-neutral-400 transition-colors hover:bg-white hover:text-neutral-700"
      >
        <X className="h-3.5 w-3.5" /> 둘러보기 종료
      </button>
    </div>
  );
}
