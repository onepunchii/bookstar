// DB 조회 중 즉시 뜨는 라이트 스켈레톤.
export default function MeLoading() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse px-4 py-8 sm:px-6">
      <div className="h-8 w-56 rounded-lg bg-neutral-100" />
      <div className="mt-2 h-4 w-32 rounded bg-neutral-100" />
      <div className="mt-6 h-48 rounded-2xl bg-neutral-100" />
      <div className="mt-4 h-24 rounded-2xl bg-neutral-50 ring-1 ring-neutral-100" />
    </div>
  );
}
