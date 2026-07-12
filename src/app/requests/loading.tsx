// 섭외 관리 목록/상세 진입 시 즉시 뜨는 다크 스켈레톤(리스트 형태).
export default function RequestsLoading() {
  return (
    <div className="mx-auto max-w-4xl animate-pulse px-5 py-12 sm:px-8 sm:py-16">
      <div className="h-5 w-24 rounded bg-white/10" />
      <div className="mt-3 h-9 w-40 rounded-lg bg-white/10" />
      <div className="mt-2 h-4 w-56 rounded bg-white/[0.06]" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/5"
          >
            <div className="h-12 w-12 shrink-0 rounded-xl bg-white/[0.08]" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 rounded bg-white/10" />
              <div className="h-3 w-56 rounded bg-white/[0.06]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
