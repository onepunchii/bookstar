// 관리자 상세 페이지 공용 UI — 헤더, 테이블 셸, 포맷 헬퍼.
import type { ReactNode } from "react";

export function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear().toString().slice(2)}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export function fmtWon(man: number | null) {
  if (man == null) return "—";
  if (man >= 10000) return `${(man / 10000).toLocaleString()}억`;
  return `${man.toLocaleString()}만`;
}

export function AdminPageHeader({
  title,
  count,
  desc,
}: {
  title: string;
  count?: number;
  desc?: string;
}) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2">
        <h1 className="display-kr text-2xl font-black text-white sm:text-3xl">
          {title}
        </h1>
        {count != null && (
          <span className="text-lg font-bold text-brand-400">{count}</span>
        )}
      </div>
      {desc && <p className="mt-1.5 text-sm text-white/50">{desc}</p>}
    </div>
  );
}

export function AdminTable({
  head,
  children,
  minWidth = 640,
}: {
  head: ReactNode;
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
      <div className="overflow-x-auto">
        <table
          className="w-full text-left text-sm"
          style={{ minWidth }}
        >
          <thead className="bg-white/[0.03] text-xs text-white/45">
            <tr>{head}</tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return <th className="px-4 py-3 font-semibold">{children}</th>;
}

export function Td({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={`px-4 py-3 text-white/85 ${className}`}>{children}</td>;
}

export function Pill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "green" | "red" | "muted";
}) {
  const tones: Record<string, string> = {
    neutral: "bg-white/8 text-white/80",
    brand: "bg-brand-500/15 text-brand-300",
    green: "bg-emerald-500/15 text-emerald-300",
    red: "bg-red-500/15 text-red-300",
    muted: "bg-white/5 text-white/40",
  };
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export const ROLE_LABEL: Record<string, string> = {
  company: "광고주",
  agency: "소속사",
  artist: "아티스트",
  admin: "관리자",
};

export const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  reviewing: "검토중",
  negotiating: "협의중",
  accepted: "수락",
  rejected: "거절",
  completed: "완료",
};

export function statusTone(
  status: string
): "neutral" | "brand" | "green" | "red" | "muted" {
  if (status === "accepted" || status === "completed") return "green";
  if (status === "rejected") return "red";
  if (status === "negotiating" || status === "reviewing") return "brand";
  return "neutral";
}
