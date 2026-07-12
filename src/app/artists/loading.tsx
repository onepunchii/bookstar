// 아티스트 목록/상세 진입 시 즉시 뜨는 다크 스켈레톤(그리드 형태).
export default function ArtistsLoading() {
  return (
    <div className="adv-dark min-h-dvh">
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-8">
        <div className="h-5 w-28 rounded bg-white/10" />
        <div className="mt-3 h-9 w-64 rounded-lg bg-white/10" />
        <div className="mt-6 h-12 w-full rounded-2xl bg-white/[0.06]" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] rounded-2xl bg-white/[0.06] ring-1 ring-white/5"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
