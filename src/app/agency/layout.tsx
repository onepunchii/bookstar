import type { Metadata } from "next";
import { ScopeToggle } from "@/components/scope-toggle";
import { AgencyTabs } from "./agency-tabs";

// 소속사 센터는 로그인 뒤 비공개 앱 화면 → 색인 제외
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">소속사 센터</h1>
        <div className="flex items-center gap-3">
          <ScopeToggle />
          <span className="hidden text-sm text-neutral-400 sm:inline">
            스타원엔터테인먼트
          </span>
        </div>
      </div>
      <p className="mb-5 text-sm text-neutral-500">
        아티스트 프로필, 일정, 섭외 요청을 한 곳에서 관리하세요
      </p>
      <AgencyTabs />
      <div className="pt-6">{children}</div>
    </div>
  );
}
