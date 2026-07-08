// 관리자 · 가입자 상세 — 전체 유저, 유입·연락처·이메일.
import { getAdminUsers, requireAdmin } from "@/lib/data/admin";
import { AdminGate } from "../admin-gate";
import {
  AdminPageHeader,
  AdminTable,
  fmtDateTime,
  Pill,
  ROLE_LABEL,
  Td,
  Th,
} from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "관리자 · 가입자" };

export default async function AdminUsersPage() {
  if (!(await requireAdmin())) return <AdminGate />;
  const users = await getAdminUsers();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <AdminPageHeader
        title="가입자"
        count={users.length}
        desc="카카오 로그인으로 유입된 실계정과 시드 계정 전체입니다."
      />
      <AdminTable
        minWidth={720}
        head={
          <>
            <Th>이름</Th>
            <Th>역할</Th>
            <Th>구분</Th>
            <Th>회사</Th>
            <Th>연락처</Th>
            <Th>유입</Th>
            <Th>가입일</Th>
          </>
        }
      >
        {users.map((u) => (
          <tr key={u.id}>
            <Td className="font-medium">{u.name}</Td>
            <Td>
              <Pill tone={u.role === "admin" ? "brand" : "neutral"}>
                {ROLE_LABEL[u.role] ?? u.role}
              </Pill>
            </Td>
            <Td className="text-xs text-white/55">
              {u.accountType === "business"
                ? "기업"
                : u.accountType === "personal"
                  ? "개인"
                  : "—"}
            </Td>
            <Td className="text-xs text-white/70">{u.company ?? "—"}</Td>
            <Td className="text-xs text-white/60">
              {u.phone ?? u.email ?? "—"}
            </Td>
            <Td>
              {u.kakaoId ? (
                <span className="text-xs font-semibold text-brand-400">
                  카카오
                </span>
              ) : (
                <span className="text-xs text-white/40">시드</span>
              )}
            </Td>
            <Td className="text-xs tabular-nums text-white/50">
              {fmtDateTime(u.createdAt)}
            </Td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
