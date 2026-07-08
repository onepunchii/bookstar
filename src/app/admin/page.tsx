// 관리자 허브 — 전체 가입자·유입·섭외 현황. users.role='admin' 전용.
import Link from "next/link";
import { getSessionUser } from "@/lib/data/session";
import { getAdminOverview } from "@/lib/data/admin";
import {
  Building2,
  CircleUserRound,
  Inbox,
  Mail,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = { title: "관리자" };

const ROLE_LABEL: Record<string, string> = {
  company: "광고주",
  agency: "소속사",
  artist: "아티스트",
  admin: "관리자",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "대기",
  reviewing: "검토중",
  negotiating: "협의중",
  accepted: "수락",
  rejected: "거절",
  completed: "완료",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear().toString().slice(2)}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default async function AdminHubPage() {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-white/30" />
        <h1 className="mt-4 text-xl font-black tracking-tight text-white">
          관리자 전용
        </h1>
        <p className="mt-3 text-sm text-white/50">
          이 페이지는 xong 운영 관리자만 접근할 수 있어요.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/15"
        >
          홈으로
        </Link>
      </div>
    );
  }

  const o = await getAdminOverview();

  const cards = [
    {
      icon: CircleUserRound,
      label: "광고주",
      value: o.totals.advertisers,
      sub: `카카오 유입 ${o.totals.kakaoUsers} · 시드 ${o.totals.seedUsers}`,
    },
    { icon: Building2, label: "소속사", value: o.entities.agencies, sub: `유저 ${o.totals.agencies}` },
    { icon: Sparkles, label: "아티스트", value: o.entities.artists, sub: `크리에이터 유저 ${o.totals.artists}` },
    { icon: Inbox, label: "섭외 요청", value: o.entities.bookingRequests, sub: "누적 유입" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-12">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-brand-500" />
        <span className="text-xs font-bold uppercase tracking-wider text-brand-400">
          Admin
        </span>
      </div>
      <h1 className="display-kr mt-2 text-3xl font-black text-white sm:text-4xl">
        운영 관리자
      </h1>
      <p className="mt-2 text-sm text-white/50">
        전체 가입자 유입, 섭외 현황, 아웃리치를 한 곳에서 봅니다.
      </p>

      {/* 요약 카드 */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10"
          >
            <c.icon className="h-4.5 w-4.5 text-white/40" />
            <p className="mt-3 text-3xl font-black text-white">{c.value}</p>
            <p className="mt-1 text-xs font-semibold text-white/70">{c.label}</p>
            <p className="mt-0.5 text-[11px] text-white/40">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* 아웃리치 바로가기 */}
      <Link
        href="/admin/outreach"
        className="mt-4 flex items-center justify-between rounded-2xl bg-brand-500/10 p-5 ring-1 ring-brand-500/25 transition-colors hover:bg-brand-500/15"
      >
        <div className="flex items-center gap-3">
          <Mail className="h-5 w-5 text-brand-400" />
          <div>
            <p className="text-sm font-bold text-white">아웃리치 콘솔</p>
            <p className="text-xs text-white/50">
              메일 대상 {o.entities.outreachContacts}건 · 승인 대기 회신{" "}
              {o.entities.pendingReplies}건
            </p>
          </div>
        </div>
        {o.entities.pendingReplies > 0 && (
          <span className="rounded-full bg-brand-500 px-3 py-1 text-xs font-bold text-white">
            {o.entities.pendingReplies} 대기
          </span>
        )}
      </Link>

      {/* 최근 가입자 */}
      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-bold text-white">최근 가입자</h2>
          <span className="text-xs text-white/40">({o.recentUsers.length})</span>
        </div>
        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs text-white/45">
                <tr>
                  <th className="px-4 py-3 font-semibold">이름</th>
                  <th className="px-4 py-3 font-semibold">역할</th>
                  <th className="px-4 py-3 font-semibold">구분</th>
                  <th className="px-4 py-3 font-semibold">유입</th>
                  <th className="px-4 py-3 font-semibold">가입일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {o.recentUsers.map((u) => (
                  <tr key={u.id} className="text-white/85">
                    <td className="px-4 py-3 font-medium">
                      {u.name}
                      {u.company && (
                        <span className="ml-1.5 text-xs text-white/40">
                          · {u.company}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs font-semibold">
                        {ROLE_LABEL[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white/55">
                      {u.accountType === "business"
                        ? "기업"
                        : u.accountType === "personal"
                          ? "개인"
                          : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          u.source === "kakao"
                            ? "text-xs font-semibold text-brand-400"
                            : "text-xs text-white/40"
                        }
                      >
                        {u.source === "kakao" ? "카카오" : "시드"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-white/50">
                      {fmtDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 최근 섭외 요청 */}
      <section className="mt-10">
        <div className="mb-3 flex items-center gap-2">
          <Inbox className="h-4 w-4 text-white/40" />
          <h2 className="text-sm font-bold text-white">최근 섭외 요청</h2>
          <span className="text-xs text-white/40">
            ({o.recentBookings.length})
          </span>
        </div>
        <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead className="bg-white/[0.03] text-xs text-white/45">
                <tr>
                  <th className="px-4 py-3 font-semibold">광고주</th>
                  <th className="px-4 py-3 font-semibold">상태</th>
                  <th className="px-4 py-3 font-semibold">요청일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06]">
                {o.recentBookings.map((b) => (
                  <tr key={b.id} className="text-white/85">
                    <td className="px-4 py-3 font-medium">
                      {b.companyName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/60">
                      {STATUS_LABEL[b.status] ?? b.status}
                    </td>
                    <td className="px-4 py-3 text-xs tabular-nums text-white/50">
                      {fmtDate(b.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
