"use client";

// 아웃리치 콘솔 본문 — 대상 등록·발송·답장 승인 인터랙션.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Stat {
  segment: string;
  status: string;
  count: number;
}

interface PendingReply {
  id: string;
  fromEmail: string;
  subject: string | null;
  body: string;
  intent: string | null;
  summary: string | null;
  draft: string | null;
  createdAt: string;
}

const SEGMENT_LABEL: Record<string, string> = {
  agency: "엔터 기획사",
  creator: "유튜버·크리에이터",
  company: "기업·광고주",
};
const STATUS_LABEL: Record<string, string> = {
  queued: "대기",
  sent: "발송됨",
  opened: "열람",
  replied: "답장",
  bounced: "반송",
  unsubscribed: "수신거부",
  failed: "실패",
};
const INTENT_LABEL: Record<string, string> = {
  interested: "관심 있음",
  question: "질문",
  rejected: "거절",
  meeting: "미팅 요청",
  other: "기타",
};

export function OutreachConsole({
  stats,
  pendingReplies,
}: {
  stats: Stat[];
  pendingReplies: PendingReply[];
}) {
  const router = useRouter();
  const [csv, setCsv] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const totals = useMemo(() => {
    const bySegment: Record<string, Record<string, number>> = {};
    for (const s of stats) {
      bySegment[s.segment] ??= {};
      bySegment[s.segment][s.status] = s.count;
    }
    return bySegment;
  }, [stats]);

  async function importContacts() {
    const rows = csv
      .split("\n")
      .map((line) => line.split(",").map((c) => c.trim()))
      .filter((cols) => cols.length >= 2 && cols[0].includes("@"))
      .map(([email, segment, name, org]) => ({ email, segment, name, org }));
    if (rows.length === 0) {
      setMessage("형식: 이메일,세그먼트(agency|creator|company),이름,조직 — 한 줄에 하나");
      return;
    }
    setBusy("import");
    const res = await fetch("/api/outreach/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? `등록 ${data.inserted}건 · 중복 제외 ${data.skipped}건`
        : `실패: ${data.error}`
    );
    setBusy(null);
    setCsv("");
    router.refresh();
  }

  async function sendBatch() {
    if (!confirm("발송 큐를 실행할까요? (우선순위: 엔터 → 유튜버 → 기업, 최대 50통)")) return;
    setBusy("send");
    const res = await fetch("/api/outreach/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 50 }),
    });
    const data = await res.json();
    setMessage(
      res.ok
        ? `발송 ${data.sent}/${data.candidates}건${data.errors?.length ? ` · 오류 ${data.errors.length}건` : ""}`
        : `실패: ${data.error}`
    );
    setBusy(null);
    router.refresh();
  }

  async function actOnReply(id: string, action: "approve" | "dismiss", draft?: string) {
    setBusy(id);
    const res = await fetch(`/api/outreach/replies/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, draft }),
    });
    const data = await res.json();
    if (!res.ok) setMessage(`실패: ${data.error}`);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-black tracking-tight">아웃리치</h1>
      <p className="mt-1 text-sm text-neutral-500">
        콜드메일 캠페인 — 대상 등록 → 자동 발송(일 1회 크론 + 수동) → 답장 AI 초안 승인
      </p>

      {message && (
        <div className="mt-4 rounded-lg bg-neutral-900 px-4 py-2.5 text-sm text-white">
          {message}
        </div>
      )}

      {/* 현황 */}
      <section className="mt-8">
        <h2 className="text-sm font-bold text-neutral-400">현황</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(["agency", "creator", "company"] as const).map((seg) => {
            const s = totals[seg] ?? {};
            const total = Object.values(s).reduce((a, b) => a + b, 0);
            return (
              <div key={seg} className="rounded-xl border border-neutral-200 p-4">
                <div className="text-sm font-bold">{SEGMENT_LABEL[seg]}</div>
                <div className="mt-1 text-2xl font-black tabular-nums">{total}</div>
                <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-neutral-500">
                  {Object.entries(s).map(([st, n]) => (
                    <span key={st} className="rounded-full bg-neutral-100 px-2 py-0.5">
                      {STATUS_LABEL[st] ?? st} {n}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 대상 등록 */}
      <section className="mt-10">
        <h2 className="text-sm font-bold text-neutral-400">대상 등록</h2>
        <p className="mt-1 text-xs text-neutral-400">
          한 줄에 하나: <code>이메일,세그먼트,이름,조직</code> · 세그먼트는{" "}
          <code>agency</code>(엔터·최우선) / <code>creator</code> / <code>company</code>
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={5}
          placeholder={"contact@starent.co.kr,agency,김실장,스타엔터\nhello@creator.com,creator,,미니멀유튜브"}
          className="mt-3 w-full rounded-xl border border-neutral-200 p-3 font-mono text-xs focus:border-neutral-900 focus:outline-none"
        />
        <button
          onClick={importContacts}
          disabled={busy === "import"}
          className="mt-2 rounded-full bg-neutral-900 px-5 py-2 text-sm font-bold text-white disabled:opacity-40"
        >
          {busy === "import" ? "등록 중…" : "등록"}
        </button>
      </section>

      {/* 발송 */}
      <section className="mt-10">
        <h2 className="text-sm font-bold text-neutral-400">발송</h2>
        <p className="mt-1 text-xs text-neutral-400">
          크론이 매일 자동 실행됩니다. 지금 바로 보내려면 수동 실행 — 1차 발송 후 4일
          무응답이면 리마인드 1회, 답장·수신거부·반송은 영구 제외.
        </p>
        <button
          onClick={sendBatch}
          disabled={busy === "send"}
          className="mt-3 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white disabled:opacity-40"
        >
          {busy === "send" ? "발송 중…" : "지금 발송 실행 (최대 50통)"}
        </button>
      </section>

      {/* 답장함 */}
      <section className="mt-10">
        <h2 className="text-sm font-bold text-neutral-400">
          답장함 — AI 초안 승인 대기 {pendingReplies.length}건
        </h2>
        <div className="mt-3 space-y-4">
          {pendingReplies.length === 0 && (
            <p className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">
              대기 중인 답장이 없습니다. 답장이 오면 AI가 초안을 만들어 여기에 쌓아둡니다.
            </p>
          )}
          {pendingReplies.map((r) => (
            <div key={r.id} className="rounded-xl border border-neutral-200 p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold">{r.fromEmail}</span>
                {r.intent && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 font-bold text-brand-600">
                    {INTENT_LABEL[r.intent] ?? r.intent}
                  </span>
                )}
                <span className="text-neutral-400">
                  {new Date(r.createdAt).toLocaleString("ko-KR")}
                </span>
              </div>
              {r.summary && (
                <p className="mt-2 text-sm font-semibold text-neutral-800">{r.summary}</p>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-neutral-400">
                  받은 원문 보기
                </summary>
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-xs text-neutral-600">
                  {r.body.slice(0, 2000)}
                </p>
              </details>
              <textarea
                value={drafts[r.id] ?? r.draft ?? ""}
                onChange={(e) => setDrafts({ ...drafts, [r.id]: e.target.value })}
                rows={6}
                placeholder="AI 초안이 없습니다 — 직접 작성하세요"
                className="mt-3 w-full rounded-xl border border-neutral-200 p-3 text-sm leading-relaxed focus:border-neutral-900 focus:outline-none"
              />
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => actOnReply(r.id, "approve", drafts[r.id] ?? r.draft ?? "")}
                  disabled={busy === r.id}
                  className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-40"
                >
                  승인·발송
                </button>
                <button
                  onClick={() => actOnReply(r.id, "dismiss")}
                  disabled={busy === r.id}
                  className="rounded-full border border-neutral-200 px-4 py-1.5 text-xs font-semibold text-neutral-500 disabled:opacity-40"
                >
                  무시
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
