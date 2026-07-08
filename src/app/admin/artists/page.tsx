// 관리자 · 아티스트 상세 — 소속·카테고리·팔로워·공개 상태.
import Link from "next/link";
import { getAdminArtists, requireAdmin } from "@/lib/data/admin";
import { CATEGORY_LABELS, formatFollowers } from "@/lib/types";
import { AdminGate } from "../admin-gate";
import {
  AdminPageHeader,
  AdminTable,
  Pill,
  Td,
  Th,
} from "../ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "관리자 · 아티스트" };

export default async function AdminArtistsPage() {
  if (!(await requireAdmin())) return <AdminGate />;
  const artists = await getAdminArtists();

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <AdminPageHeader
        title="아티스트"
        count={artists.length}
        desc="등록된 전체 아티스트와 공개 상태, 팔로워 규모입니다."
      />
      <AdminTable
        minWidth={720}
        head={
          <>
            <Th>이름</Th>
            <Th>소속사</Th>
            <Th>카테고리</Th>
            <Th>팔로워</Th>
            <Th>상태</Th>
            <Th>공개 링크</Th>
          </>
        }
      >
        {artists.map((a) => (
          <tr key={a.id}>
            <Td className="font-medium">
              {a.name}
              {a.groupName && (
                <span className="ml-1.5 text-xs text-white/40">
                  · {a.groupName}
                </span>
              )}
              {a.verified && (
                <span className="ml-1.5 text-[11px] text-brand-400">인증</span>
              )}
            </Td>
            <Td className="text-xs text-white/70">{a.agencyName ?? "—"}</Td>
            <Td className="text-xs text-white/60">
              {a.categories
                .map((c) => CATEGORY_LABELS[c as keyof typeof CATEGORY_LABELS] ?? c)
                .join(", ") || "—"}
            </Td>
            <Td className="tabular-nums text-white/80">
              {a.followers != null ? formatFollowers(a.followers) : "—"}
            </Td>
            <Td>
              <Pill tone={a.status === "active" ? "green" : "muted"}>
                {a.status === "active" ? "공개" : a.status}
              </Pill>
            </Td>
            <Td>
              {a.slug ? (
                <Link
                  href={`/p/${a.slug}`}
                  target="_blank"
                  className="text-xs font-semibold text-brand-400 hover:underline"
                >
                  /p/{a.slug}
                </Link>
              ) : (
                <span className="text-xs text-white/40">—</span>
              )}
            </Td>
          </tr>
        ))}
      </AdminTable>
    </div>
  );
}
