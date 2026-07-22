"use client";

// 라우트 전환 중 콘텐츠 영역에 즉시 뜨는 스피너 — 셸(내비/헤더)은 유지되고
// 본문만 이걸로 바뀌어 "전환은 됐고 불러오는 중"으로 보이게 한다. 테마 중립(브랜드색).
// 클라 컴포넌트라 Suspense fallback으로도 동기 렌더 가능.
import { useT } from "@/lib/i18n/client";

export function RouteSpinner({ label }: { label?: string }) {
  const t = useT();
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500/25 border-t-brand-500"
          aria-hidden
        />
        <span className="text-xs font-medium text-neutral-400">
          {label ?? t("common.loading")}
        </span>
        <span className="sr-only">{t("common.loadingPage")}</span>
      </div>
    </div>
  );
}
