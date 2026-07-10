// 관리자 · 에러 수집 — 서버(onRequestError)·클라이언트(window 리스너)에서 올라온 런타임 에러.
// 같은 버그는 fingerprint로 묶여 한 행에 count로 쌓인다.
import { getAdminErrors, requireAdmin } from "@/lib/data/admin";
import { AdminGate } from "../admin-gate";
import { AdminPageHeader, fmtDateTime, Pill } from "../ui";
import { ErrorActions } from "./error-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "관리자 · 에러" };

function ago(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

export default async function AdminErrorsPage() {
  if (!(await requireAdmin())) return <AdminGate />;
  const rows = await getAdminErrors();

  const open = rows.filter((r) => r.status === "open");
  const dayAgo = Date.now() - 86400000;
  const last24 = rows.filter((r) => new Date(r.lastSeen).getTime() > dayAgo);
  const events = rows.reduce((s, r) => s + r.count, 0);

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <AdminPageHeader
        title="에러"
        count={open.length}
        desc={`미해결 ${open.length}종 · 최근 24시간 ${last24.length}종 · 누적 ${events.toLocaleString()}건`}
      />

      <div className="space-y-3">
        {rows.map((e) => {
          const dim = e.status !== "open";
          return (
            <div
              key={e.id}
              className={
                dim
                  ? "rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 opacity-55"
                  : "rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10"
              }
            >
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={e.source === "server" ? "red" : "brand"}>
                  {e.source === "server" ? "서버" : "클라이언트"}
                </Pill>
                {e.count > 1 && <Pill tone="neutral">{e.count}회</Pill>}
                {e.status === "resolved" && <Pill tone="green">해결됨</Pill>}
                {e.status === "ignored" && <Pill tone="muted">무시</Pill>}
                <span className="text-xs tabular-nums text-white/35">
                  {ago(e.lastSeen)} · {fmtDateTime(e.lastSeen)}
                </span>
                <div className="ml-auto">
                  <ErrorActions id={e.id} status={e.status} />
                </div>
              </div>

              <p className="mt-3 break-words font-mono text-[13px] leading-relaxed text-white/90">
                {e.message}
              </p>

              <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
                {e.url && (
                  <span className="font-mono text-white/55">
                    {e.method && `${e.method} `}
                    {e.url}
                  </span>
                )}
                {e.userName && <span>사용자 · {e.userName}</span>}
                {e.digest && (
                  <span className="font-mono">digest {e.digest}</span>
                )}
                <span>최초 {fmtDateTime(e.firstSeen)}</span>
              </div>

              {e.stack && (
                <details className="mt-3 group">
                  <summary className="cursor-pointer text-xs font-semibold text-white/45 hover:text-white/70">
                    스택 추적 보기
                  </summary>
                  <pre className="mt-2 max-h-72 overflow-auto rounded-xl bg-black/40 p-3.5 font-mono text-[11px] leading-relaxed text-white/55 ring-1 ring-white/5">
                    {e.stack}
                  </pre>
                </details>
              )}

              {e.userAgent && (
                <p className="mt-2 truncate text-[11px] text-white/20">
                  {e.userAgent}
                </p>
              )}
            </div>
          );
        })}

        {rows.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-sm text-white/35">
              수집된 에러가 없어요. 조용한 게 좋은 겁니다.
            </p>
            <p className="mt-1.5 text-xs text-white/20">
              프로덕션에서 발생한 서버·클라이언트 에러가 여기에 모입니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
