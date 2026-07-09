// 관리자 · 건의함 — 제휴·버그·개선 접수 처리 (미처리 우선).
import { getAdminFeedback, requireAdmin } from "@/lib/data/admin";
import { AdminGate } from "../admin-gate";
import { AdminPageHeader, fmtDateTime, Pill } from "../ui";
import { ResolveButton } from "./resolve-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "관리자 · 건의함" };

const CAT_TONE: Record<string, "brand" | "red" | "green" | "neutral"> = {
  제휴: "brand",
  버그: "red",
  개선: "green",
  기타: "neutral",
};

export default async function AdminFeedbackPage() {
  if (!(await requireAdmin())) return <AdminGate />;
  const rows = await getAdminFeedback();
  const pending = rows.filter((r) => r.status === "new").length;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <AdminPageHeader
        title="건의함"
        count={rows.length}
        desc={`광고주·소속사가 남긴 제휴·버그·개선 건의입니다 · 미처리 ${pending}건`}
      />
      <div className="space-y-3">
        {rows.map((f) => (
          <div
            key={f.id}
            className={
              f.status === "done"
                ? "rounded-2xl bg-white/[0.02] p-5 ring-1 ring-white/5 opacity-55"
                : "rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10"
            }
          >
            <div className="flex flex-wrap items-center gap-2">
              <Pill tone={CAT_TONE[f.category] ?? "neutral"}>{f.category}</Pill>
              <Pill tone="muted">
                {f.role === "agency" ? "소속사" : "광고주"}
              </Pill>
              {f.userName && (
                <span className="text-xs font-semibold text-white/60">
                  {f.userName}
                </span>
              )}
              <span className="text-xs tabular-nums text-white/35">
                {fmtDateTime(f.createdAt)}
              </span>
              <div className="ml-auto">
                <ResolveButton id={f.id} status={f.status} />
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/85">
              {f.body}
            </p>
            {f.contact && (
              <p className="mt-2 text-xs text-brand-300">회신처 · {f.contact}</p>
            )}
          </div>
        ))}
        {rows.length === 0 && (
          <p className="py-14 text-center text-sm text-white/35">
            아직 접수된 건의가 없어요.
          </p>
        )}
      </div>
    </div>
  );
}
