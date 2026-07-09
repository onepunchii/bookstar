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
import { AgencyVerifyActions } from "./verify-actions";

const VS: Record<string, { label: string; tone: "green" | "brand" | "red" | "muted" }> = {
  verified: { label: "인증됨", tone: "green" },
  pending: { label: "심사 대기", tone: "brand" },
  rejected: { label: "반려", tone: "red" },
};

export const dynamic = "force-dynamic";
export const metadata = { title: "관리자 · 소속사" };

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
        minWidth={860}
        head={
          <>
            <Th>소속사</Th>
            <Th>인증</Th>
            <Th>유형</Th>
            <Th>아티스트</Th>
            <Th>담당자</Th>
            <Th>서류·처리</Th>
            <Th>가입일</Th>
          </>
        }
      >
        {agencies.map((a) => {
          const vs = VS[a.verificationStatus] ?? VS.pending;
          return (
            <tr key={a.id}>
              <Td className="font-medium">{a.companyName}</Td>
              <Td>
                <Pill tone={vs.tone}>{vs.label}</Pill>
              </Td>
              <Td className="text-xs text-white/60">
                {a.agencyType === "solo" ? "1인" : "기업"}
              </Td>
              <Td className="tabular-nums">{a.artistCount}</Td>
              <Td className="text-xs text-white/70">{a.manager ?? "—"}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  {a.businessDocUrl ? (
                    <a
                      href={a.businessDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-brand-400 hover:underline"
                    >
                      서류 보기
                    </a>
                  ) : (
                    <span className="text-xs text-white/30">서류 없음</span>
                  )}
                  {a.verificationStatus !== "verified" && (
                    <AgencyVerifyActions agencyId={a.id} />
                  )}
                </div>
              </Td>
              <Td className="text-xs tabular-nums text-white/50">
                {fmtDateTime(a.createdAt)}
              </Td>
            </tr>
          );
        })}
      </AdminTable>
    </div>
  );
}
