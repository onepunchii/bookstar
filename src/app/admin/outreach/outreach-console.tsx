"use client";

// 아웃리치 콘솔 — 검토 중심 4탭.
// ① 대시보드: KPI + "다음 발송 미리보기"(누구에게 나가는지 확인 후 발송)
// ② 템플릿: 세그먼트별 실제 이메일 렌더 + 제목 A/B + 테스트 발송
// ③ 연락처: 등록 대상 전수 검토(필터) + 대상 등록
// ④ 답장함: AI 초안 승인 + 처리 이력
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminPageHeader, AdminTable, Th, Td, Pill, fmtDateTime } from "../ui";
import { cn } from "@/lib/utils";

interface Stat {
  segment: string;
  status: string;
  count: number;
}

interface ContactRow {
  id: string;
  email: string;
  name: string | null;
  org: string | null;
  segment: string;
  status: string;
  sentCount: number;
  lastSentAt: string | null;
  createdAt: string;
}

interface TemplatePreview {
  segment: string;
  subjects: string[];
  reminderSubject: string;
  preheader: string;
  ctaPath: string;
  html: string;
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

interface ProcessedReply {
  id: string;
  fromEmail: string;
  intent: string | null;
  summary: string | null;
  status: string;
  sentAt: string | null;
  createdAt: string;
}

const SEGMENT_LABEL: Record<string, string> = {
  agency: "기획사",
  creator: "1인기획사",
  company: "광고주",
};
const STATUS_LABEL: Record<string, string> = {
  queued: "대기",
  sending: "발송 중",
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

function statusTone(
  s: string
): "neutral" | "brand" | "green" | "red" | "muted" {
  if (s === "replied") return "green";
  if (s === "opened" || s === "sending") return "brand";
  if (s === "bounced" || s === "failed") return "red";
  if (s === "unsubscribed") return "muted";
  return "neutral";
}

const TABS = ["대시보드", "템플릿", "연락처", "답장함"] as const;
type Tab = (typeof TABS)[number];

export function OutreachConsole({
  stats,
  nextBatch,
  contacts,
  templates,
  pendingReplies,
  processedReplies,
}: {
  stats: Stat[];
  nextBatch: ContactRow[];
  contacts: ContactRow[];
  templates: TemplatePreview[];
  pendingReplies: PendingReply[];
  processedReplies: ProcessedReply[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("대시보드");
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // ── 집계 ──
  const totals = useMemo(() => {
    const byStatus: Record<string, number> = {};
    const bySegment: Record<string, Record<string, number>> = {};
    let all = 0;
    for (const s of stats) {
      byStatus[s.status] = (byStatus[s.status] ?? 0) + s.count;
      bySegment[s.segment] ??= {};
      bySegment[s.segment][s.status] = s.count;
      all += s.count;
    }
    const delivered =
      (byStatus.sent ?? 0) + (byStatus.opened ?? 0) + (byStatus.replied ?? 0);
    return { all, byStatus, bySegment, delivered };
  }, [stats]);

  async function api(path: string, body: unknown, busyKey: string) {
    setBusy(busyKey);
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(`실패: ${data.error ?? res.status}`);
        return null;
      }
      return data;
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <AdminPageHeader
        title="아웃리치"
        count={totals.all}
        desc="콜드메일 캠페인 — 검토하고, 발송하고, 답장을 승인하세요"
      />

      {/* 서브탭 */}
      <div className="mb-6 flex gap-1.5 overflow-x-auto hide-scrollbar">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              tab === t
                ? "bg-white text-neutral-900"
                : "bg-white/6 text-white/55 hover:bg-white/10 hover:text-white/85"
            )}
          >
            {t}
            {t === "답장함" && pendingReplies.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingReplies.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {message && (
        <div className="mb-5 flex items-center justify-between rounded-xl bg-white/8 px-4 py-2.5 text-sm text-white/90 ring-1 ring-white/10">
          {message}
          <button
            onClick={() => setMessage(null)}
            className="ml-3 text-white/40 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {tab === "대시보드" && (
        <Dashboard
          totals={totals}
          nextBatch={nextBatch}
          busy={busy}
          onSend={async () => {
            if (
              !confirm(
                `아래 미리보기 명단 ${nextBatch.length}건(최대 40건)에 발송합니다. 진행할까요?`
              )
            )
              return;
            const r = await api("/api/outreach/send", { limit: 40 }, "send");
            if (r)
              setMessage(
                `발송 ${r.sent}/${r.claimed}건 완료${r.errors?.length ? ` · 오류 ${r.errors.length}건` : ""}`
              );
            router.refresh();
          }}
        />
      )}

      {tab === "템플릿" && (
        <Templates
          templates={templates}
          busy={busy}
          onTestSend={async (segment, to, reminder) => {
            const r = await api(
              "/api/outreach/test-send",
              { segment, to, reminder },
              `test-${segment}`
            );
            if (r) setMessage(`테스트 발송 완료 → ${to}`);
          }}
        />
      )}

      {tab === "연락처" && (
        <Contacts
          contacts={contacts}
          busy={busy}
          onImport={async (rows) => {
            const r = await api("/api/outreach/contacts", { rows }, "import");
            if (r)
              setMessage(`등록 ${r.inserted}건 · 중복 제외 ${r.skipped}건`);
            router.refresh();
          }}
        />
      )}

      {tab === "답장함" && (
        <Replies
          pending={pendingReplies}
          processed={processedReplies}
          busy={busy}
          onAct={async (id, action, draft) => {
            const r = await api(
              `/api/outreach/replies/${id}`,
              { action, draft },
              id
            );
            if (r)
              setMessage(action === "approve" ? "답장 발송 완료" : "무시 처리됨");
            router.refresh();
          }}
        />
      )}
    </main>
  );
}

// ══════════════ ① 대시보드 ══════════════

function Dashboard({
  totals,
  nextBatch,
  busy,
  onSend,
}: {
  totals: {
    all: number;
    byStatus: Record<string, number>;
    bySegment: Record<string, Record<string, number>>;
    delivered: number;
  };
  nextBatch: ContactRow[];
  busy: string | null;
  onSend: () => void;
}) {
  const s = totals.byStatus;
  const replyRate =
    totals.delivered > 0
      ? Math.round(((s.replied ?? 0) / totals.delivered) * 100)
      : null;

  const kpis: { label: string; value: number; accent?: boolean; sub?: string }[] =
    [
      { label: "전체 대상", value: totals.all },
      { label: "발송 대기", value: s.queued ?? 0 },
      { label: "발송됨", value: (s.sent ?? 0) + (s.sending ?? 0) },
      { label: "열람", value: s.opened ?? 0 },
      {
        label: "답장",
        value: s.replied ?? 0,
        accent: true,
        sub: replyRate != null ? `답장률 ${replyRate}%` : undefined,
      },
      {
        label: "제외됨",
        value: (s.unsubscribed ?? 0) + (s.bounced ?? 0) + (s.failed ?? 0),
        sub: "수신거부·반송·실패",
      },
    ];

  return (
    <div className="space-y-8">
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k) => (
          <div
            key={k.label}
            className={cn(
              "rounded-2xl p-4 ring-1",
              k.accent
                ? "bg-brand-500/12 ring-brand-500/30"
                : "bg-white/[0.03] ring-white/10"
            )}
          >
            <div className="text-xs font-semibold text-white/45">{k.label}</div>
            <div
              className={cn(
                "mt-1.5 text-2xl font-black tabular-nums",
                k.accent ? "text-brand-400" : "text-white"
              )}
            >
              {k.value}
            </div>
            {k.sub && (
              <div className="mt-0.5 text-[11px] text-white/35">{k.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* 세그먼트별 현황 */}
      <section>
        <h2 className="mb-3 text-sm font-bold text-white/45">세그먼트별 현황</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["agency", "creator", "company"] as const).map((seg) => {
            const m = totals.bySegment[seg] ?? {};
            const total = Object.values(m).reduce((a, b) => a + b, 0);
            return (
              <div
                key={seg}
                className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-bold text-white">
                    {SEGMENT_LABEL[seg]}
                  </span>
                  <span className="text-lg font-black tabular-nums text-white/85">
                    {total}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {Object.entries(m).map(([st, n]) => (
                    <Pill key={st} tone={statusTone(st)}>
                      {STATUS_LABEL[st] ?? st} {n}
                    </Pill>
                  ))}
                  {total === 0 && (
                    <span className="text-xs text-white/30">등록된 대상 없음</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 다음 발송 미리보기 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white/45">
            다음 발송 미리보기{" "}
            <span className="text-brand-400">{nextBatch.length}건</span>
            <span className="ml-2 font-normal text-white/30">
              — 지금 발송을 실행하면 이 명단에 나갑니다 (우선순위순, 최대 40건)
            </span>
          </h2>
        </div>
        {nextBatch.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
            발송 대기 중인 대상이 없습니다. 연락처 탭에서 대상을 등록하세요.
          </p>
        ) : (
          <>
            <AdminTable
              head={
                <>
                  <Th>이메일</Th>
                  <Th>이름 · 조직</Th>
                  <Th>세그먼트</Th>
                  <Th>유형</Th>
                </>
              }
            >
              {nextBatch.map((c) => (
                <tr key={c.id}>
                  <Td className="font-medium">{c.email}</Td>
                  <Td>
                    {c.name ?? "—"}
                    {c.org && (
                      <span className="text-white/45"> · {c.org}</span>
                    )}
                  </Td>
                  <Td>
                    <Pill tone="neutral">{SEGMENT_LABEL[c.segment]}</Pill>
                  </Td>
                  <Td>
                    {c.sentCount >= 1 ? (
                      <Pill tone="brand">리마인드</Pill>
                    ) : c.status === "sending" ? (
                      <Pill tone="red">재시도</Pill>
                    ) : (
                      <Pill tone="green">1차</Pill>
                    )}
                  </Td>
                </tr>
              ))}
            </AdminTable>
            <button
              onClick={onSend}
              disabled={busy === "send"}
              className="mt-4 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-white shadow-[0_8px_24px_-8px_rgba(255,90,0,0.6)] transition-transform hover:-translate-y-0.5 disabled:opacity-40"
            >
              {busy === "send"
                ? "발송 중…"
                : `이 명단에 발송 실행 (${nextBatch.length}건)`}
            </button>
          </>
        )}
      </section>
    </div>
  );
}

// ══════════════ ② 템플릿 ══════════════

function Templates({
  templates,
  busy,
  onTestSend,
}: {
  templates: TemplatePreview[];
  busy: string | null;
  onTestSend: (segment: string, to: string, reminder: boolean) => void;
}) {
  const [seg, setSeg] = useState(templates[0]?.segment ?? "agency");
  const [testTo, setTestTo] = useState("");
  const t = templates.find((x) => x.segment === seg) ?? templates[0];
  if (!t) return null;

  return (
    <div className="space-y-5">
      {/* 세그먼트 선택 */}
      <div className="flex gap-1.5">
        {templates.map((x) => (
          <button
            key={x.segment}
            onClick={() => setSeg(x.segment)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
              seg === x.segment
                ? "bg-brand-500 text-white"
                : "bg-white/6 text-white/55 hover:bg-white/10"
            )}
          >
            {SEGMENT_LABEL[x.segment]}
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* 좌: 제목·메타 검토 */}
        <div className="space-y-4">
          <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">
              제목 A/B — 연락처별 자동 분배
            </h3>
            <ul className="mt-3 space-y-2">
              {t.subjects.map((sub, i) => (
                <li key={i} className="flex gap-2 text-sm text-white/85">
                  <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white/8 text-[11px] font-bold text-white/50">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span>(광고) {sub}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">
              리마인드 제목 (4일 후 1회)
            </h3>
            <p className="mt-2 text-sm text-white/85">(광고) {t.reminderSubject}</p>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-white/40">
              프리뷰 텍스트 (제목 옆 미리보기)
            </h3>
            <p className="mt-2 text-sm text-white/60">{t.preheader}</p>
            <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-white/40">
              CTA 링크
            </h3>
            <p className="mt-2 text-sm text-brand-400">{t.ctaPath}</p>
          </div>
          {/* 테스트 발송 */}
          <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/40">
              테스트 발송 — 연락처 목록에 영향 없음
            </h3>
            <input
              type="email"
              value={testTo}
              onChange={(e) => setTestTo(e.target.value)}
              placeholder="받아볼 이메일 주소"
              className="mt-3 w-full rounded-xl bg-white/6 px-3.5 py-2.5 text-sm text-white placeholder-white/30 ring-1 ring-white/10 focus:outline-none focus:ring-brand-500/60"
            />
            <div className="mt-2.5 flex gap-2">
              <button
                onClick={() => onTestSend(t.segment, testTo, false)}
                disabled={!testTo.includes("@") || busy === `test-${t.segment}`}
                className="rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white hover:bg-white/15 disabled:opacity-40"
              >
                1차 메일 보내기
              </button>
              <button
                onClick={() => onTestSend(t.segment, testTo, true)}
                disabled={!testTo.includes("@") || busy === `test-${t.segment}`}
                className="rounded-full bg-white/6 px-4 py-2 text-xs font-semibold text-white/70 hover:bg-white/10 disabled:opacity-40"
              >
                리마인드 보내기
              </button>
            </div>
          </div>
        </div>

        {/* 우: 실제 렌더 미리보기 */}
        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
          <div className="flex items-center justify-between bg-white/[0.03] px-4 py-2.5 text-xs text-white/45">
            <span>실제 이메일 렌더 (제목 A 기준 · 샘플 수신자)</span>
            <span className="text-white/30">600px 기준</span>
          </div>
          <iframe
            title={`${SEGMENT_LABEL[t.segment]} 이메일 미리보기`}
            srcDoc={t.html}
            sandbox=""
            className="h-[820px] w-full bg-[#f4f4f5]"
          />
        </div>
      </div>
    </div>
  );
}

// ══════════════ ③ 연락처 ══════════════

function Contacts({
  contacts,
  busy,
  onImport,
}: {
  contacts: ContactRow[];
  busy: string | null;
  onImport: (
    rows: { email: string; segment: string; name?: string; org?: string }[]
  ) => void;
}) {
  const [csv, setCsv] = useState("");
  const [fSeg, setFSeg] = useState("all");
  const [fStatus, setFStatus] = useState("all");

  const filtered = contacts.filter(
    (c) =>
      (fSeg === "all" || c.segment === fSeg) &&
      (fStatus === "all" || c.status === fStatus)
  );

  function parseAndImport() {
    const rows = csv
      .split("\n")
      .map((line) => line.split(",").map((x) => x.trim()))
      .filter((cols) => cols.length >= 2 && cols[0].includes("@"))
      .map(([email, segment, name, org]) => ({ email, segment, name, org }));
    if (rows.length === 0) return;
    onImport(rows);
    setCsv("");
  }

  return (
    <div className="space-y-6">
      {/* 등록 */}
      <section className="rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/10">
        <h2 className="text-sm font-bold text-white">대상 등록</h2>
        <p className="mt-1 text-xs text-white/40">
          한 줄에 하나: <code className="text-white/60">이메일,세그먼트,이름,조직</code>{" "}
          · 세그먼트 = agency(기획사) / creator(1인기획사) / company(광고주) · 이름을
          채울수록 회신률이 올라갑니다
        </p>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={4}
          placeholder={
            "contact@starent.co.kr,agency,김실장,스타엔터\nhello@creator.com,creator,정환,미니멀유튜브"
          }
          className="mt-3 w-full rounded-xl bg-white/6 p-3.5 font-mono text-xs text-white placeholder-white/25 ring-1 ring-white/10 focus:outline-none focus:ring-brand-500/60"
        />
        <button
          onClick={parseAndImport}
          disabled={busy === "import" || !csv.trim()}
          className="mt-3 rounded-full bg-white px-5 py-2 text-sm font-bold text-neutral-900 hover:bg-white/90 disabled:opacity-40"
        >
          {busy === "import" ? "등록 중…" : "등록"}
        </button>
      </section>

      {/* 필터 + 테이블 */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="mr-2 text-sm font-bold text-white/45">
            등록된 대상 <span className="text-white/70">{filtered.length}</span>
            <span className="font-normal text-white/30"> / 최근 200</span>
          </h2>
          <select
            value={fSeg}
            onChange={(e) => setFSeg(e.target.value)}
            className="rounded-lg bg-white/6 px-2.5 py-1.5 text-xs text-white ring-1 ring-white/10 focus:outline-none"
          >
            <option value="all">모든 세그먼트</option>
            {Object.entries(SEGMENT_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <select
            value={fStatus}
            onChange={(e) => setFStatus(e.target.value)}
            className="rounded-lg bg-white/6 px-2.5 py-1.5 text-xs text-white ring-1 ring-white/10 focus:outline-none"
          >
            <option value="all">모든 상태</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
            조건에 맞는 대상이 없습니다.
          </p>
        ) : (
          <AdminTable
            head={
              <>
                <Th>이메일</Th>
                <Th>이름 · 조직</Th>
                <Th>세그먼트</Th>
                <Th>상태</Th>
                <Th>발송</Th>
                <Th>최근 발송</Th>
              </>
            }
            minWidth={760}
          >
            {filtered.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium">{c.email}</Td>
                <Td>
                  {c.name ?? "—"}
                  {c.org && <span className="text-white/45"> · {c.org}</span>}
                </Td>
                <Td>
                  <Pill tone="neutral">{SEGMENT_LABEL[c.segment]}</Pill>
                </Td>
                <Td>
                  <Pill tone={statusTone(c.status)}>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </Pill>
                </Td>
                <Td className="tabular-nums">{c.sentCount}회</Td>
                <Td className="text-white/50">
                  {c.lastSentAt ? fmtDateTime(c.lastSentAt) : "—"}
                </Td>
              </tr>
            ))}
          </AdminTable>
        )}
      </section>
    </div>
  );
}

// ══════════════ ④ 답장함 ══════════════

function Replies({
  pending,
  processed,
  busy,
  onAct,
}: {
  pending: PendingReply[];
  processed: ProcessedReply[];
  busy: string | null;
  onAct: (id: string, action: "approve" | "dismiss", draft?: string) => void;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-bold text-white/45">
          AI 초안 승인 대기{" "}
          <span className="text-brand-400">{pending.length}건</span>
        </h2>
        {pending.length === 0 && (
          <p className="rounded-2xl border border-dashed border-white/15 p-8 text-center text-sm text-white/40">
            대기 중인 답장이 없습니다. 답장이 오면 AI가 초안을 만들어 여기에
            쌓아둡니다.
          </p>
        )}
        <div className="space-y-4">
          {pending.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl bg-white/[0.03] p-5 ring-1 ring-white/10"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-white">{r.fromEmail}</span>
                {r.intent && (
                  <Pill tone={r.intent === "rejected" ? "muted" : "brand"}>
                    {INTENT_LABEL[r.intent] ?? r.intent}
                  </Pill>
                )}
                <span className="text-white/35">{fmtDateTime(r.createdAt)}</span>
              </div>
              {r.summary && (
                <p className="mt-2.5 text-sm font-semibold text-white/90">
                  {r.summary}
                </p>
              )}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-white/40 hover:text-white/60">
                  받은 원문 보기
                </summary>
                <p className="mt-2 whitespace-pre-wrap rounded-xl bg-white/[0.04] p-3.5 text-xs leading-relaxed text-white/65">
                  {r.body.slice(0, 2000)}
                </p>
              </details>
              <textarea
                value={drafts[r.id] ?? r.draft ?? ""}
                onChange={(e) =>
                  setDrafts({ ...drafts, [r.id]: e.target.value })
                }
                rows={6}
                placeholder="AI 초안이 없습니다 — 직접 작성하세요"
                className="mt-3 w-full rounded-xl bg-white/6 p-3.5 text-sm leading-relaxed text-white placeholder-white/25 ring-1 ring-white/10 focus:outline-none focus:ring-brand-500/60"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() =>
                    onAct(r.id, "approve", drafts[r.id] ?? r.draft ?? "")
                  }
                  disabled={busy === r.id}
                  className="rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white disabled:opacity-40"
                >
                  승인·발송
                </button>
                <button
                  onClick={() => onAct(r.id, "dismiss")}
                  disabled={busy === r.id}
                  className="rounded-full bg-white/6 px-4 py-2 text-xs font-semibold text-white/60 hover:bg-white/10 disabled:opacity-40"
                >
                  무시
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {processed.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-white/45">
            처리 이력 <span className="font-normal text-white/30">최근 10건</span>
          </h2>
          <AdminTable
            head={
              <>
                <Th>보낸 사람</Th>
                <Th>요약</Th>
                <Th>처리</Th>
                <Th>일시</Th>
              </>
            }
          >
            {processed.map((r) => (
              <tr key={r.id}>
                <Td className="font-medium">{r.fromEmail}</Td>
                <Td className="text-white/60">{r.summary ?? "—"}</Td>
                <Td>
                  <Pill tone={r.status === "approved" ? "green" : "muted"}>
                    {r.status === "approved" ? "답장 발송" : "무시"}
                  </Pill>
                </Td>
                <Td className="text-white/50">
                  {fmtDateTime(r.sentAt ?? r.createdAt)}
                </Td>
              </tr>
            ))}
          </AdminTable>
        </section>
      )}
    </div>
  );
}
