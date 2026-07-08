// 관리자 · 소속사 상세 — 유형·요금제·담당자·아티스트 수.
import { getAdminAgencies, requireAdmin } from "@/lib/data/admin";
import { AdminGate } from "../admin-gate";
import {
  AdminPageHeader,
  AdminTable,
  fmtDateTime,
  Pill,
  Td,
  Th,
} from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "관리자 · 소속사" };

const PLAN_LABEL: Record<string, string> = {
  free: "무료",
  growth: "그로스",
  enterprise: "엔터프라이즈",
};

export default async function AdminAgenciesPage() {
  if (!(await requireAdmin())) return <AdminGate />;
  const agencies = await getAdminAgencies();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <AdminPageHeader
        title="소속사"
        count={agencies.length}
        desc="가입한 기획사와 소속 아티스트 수, 요금제 현황입니다."
      />
      <AdminTable
        minWidth={760}
        head={
          <>
            <Th>소속사</Th>
            <Th>유형</Th>
            <Th>요금제</Th>
            <Th>아티스트</Th>
            <Th>담당자</Th>
            <Th>연락처</Th>
            <Th>가입일</Th>
          </>
        }
      >
        {agencies.map((a) => (
          <tr key={a.id}>
            <Td className="font-medium">
              {a.companyName}
              {a.verified && (
                <span className="ml-1.5 text-[11px] text-brand-400">인증</span>
              )}
            </Td>
            <Td className="text-xs text-white/60">
              {a.agencyType === "solo" ? "1인" : "기업"}
            </Td>
            <Td>
              <Pill tone={a.plan === "enterprise" ? "brand" : "muted"}>
                {PLAN_LABEL[a.plan] ?? a.plan}
              </Pill>
            </Td>
            <Td className="tabular-nums">{a.artistCount}</Td>
            <Td className="text-xs text-white/70">{a.manager ?? "—"}</Td>
            <Td className="text-xs text-white/60">
              {a.phone ?? a.email ?? "—"}
            </Td>
            <Td className="text-xs tabular-nums text-white/50">
              {fmtDateTime(a.createdAt)}
            </Td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
