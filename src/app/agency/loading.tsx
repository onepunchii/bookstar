// DB 조회 중 즉시 뜨는 라이트 스켈레톤 — 테마 전환과 본문이 같은 순간 나타나게.
export default function AgencyLoading() {
  return (
    <div className="animate-pulse">
      <div className="mb-4 h-9 w-40 rounded-lg bg-neutral-100" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="min-h-40 rounded-2xl border border-neutral-100 bg-neutral-50"
          />
        ))}
      </div>
    </div>
  );
}
