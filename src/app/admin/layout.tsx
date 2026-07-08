// 관리자 영역 셸 — 다크 배경 + 앱 복귀 링크. 앱 셸(AppShell) 밖에서 자체 크롬.
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { requireAdmin } from "@/lib/data/admin";
import { ArrowLeft } from "lucide-react";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  return (
    <div className="min-h-dvh bg-[#0a0a0b] text-white">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/8 bg-[#0a0a0b]/85 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2.5">
          <Link href="/admin" aria-label="관리자 홈" className="flex items-center gap-2.5">
            <Wordmark height={18} />
            <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-[11px] font-bold text-brand-400">
              ADMIN
            </span>
          </Link>
        </div>
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/70 hover:bg-white/12 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> 앱으로
        </Link>
      </header>
      {admin && <AdminNav />}
      {children}
    </div>
  );
}
