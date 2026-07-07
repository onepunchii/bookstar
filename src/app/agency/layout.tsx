import { AgencyTabs } from "./agency-tabs";

export default function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-black tracking-tight">소속사 센터</h1>
        <span className="text-sm text-neutral-400">스타원엔터테인먼트</span>
      </div>
      <p className="mb-5 text-sm text-neutral-500">
        아티스트 프로필, 일정, 섭외 요청을 한 곳에서 관리하세요
      </p>
      <AgencyTabs />
      <div className="pt-6">{children}</div>
    </div>
  );
}
