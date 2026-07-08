// 관리자 · 섭외 요청 상세 — 광고주·아티스트·예산·행사일·상태·유입.
import { getAdminBookings, requireAdmin } from "@/lib/data/admin";
import { AdminGate } from "../admin-gate";
import {
  AdminPageHeader,
  AdminTable,
  fmtDate,
  fmtWon,
  Pill,
  STATUS_LABEL,
  statusTone,
  Td,
  Th,
} from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "관리자 · 섭외" };

const SOURCE_LABEL: Record<string, string> = {
  platform: "플랫폼",
  ai_intake: "AI 접수",
  email: "메일",
};

export default async function AdminBookingsPage() {
  if (!(await requireAdmin())) return <AdminGate />;
  const bookings = await getAdminBookings();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <AdminPageHeader
        title="섭외 요청"
        count={bookings.length}
        desc="플랫폼으로 유입된 전체 섭외 요청과 진행 상태입니다."
      />
      <AdminTable
        minWidth={820}
        head={
          <>
            <Th>광고주</Th>
            <Th>아티스트</Th>
            <Th>행사 유형</Th>
            <Th>예산</Th>
            <Th>행사일</Th>
            <Th>상태</Th>
            <Th>유입</Th>
            <Th>요청일</Th>
          </>
        }
      >
        {bookings.map((b) => (
          <tr key={b.id}>
            <Td className="font-medium">{b.companyName ?? "—"}</Td>
            <Td className="text-xs text-white/70">{b.artistName ?? "—"}</Td>
            <Td className="text-xs text-white/60">{b.eventType ?? "—"}</Td>
            <Td className="tabular-nums text-white/80">{fmtWon(b.budget)}</Td>
            <Td className="text-xs tabular-nums text-white/60">
              {fmtDate(b.eventDate)}
            </Td>
            <Td>
              <Pill tone={statusTone(b.status)}>
                {STATUS_LABEL[b.status] ?? b.status}
              </Pill>
            </Td>
            <Td className="text-xs text-white/50">
              {SOURCE_LABEL[b.source ?? ""] ?? b.source ?? "—"}
            </Td>
            <Td className="text-xs tabular-nums text-white/50">
              {fmtDate(b.createdAt)}
            </Td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
