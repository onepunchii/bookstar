import type { Metadata } from "next";
import { cookies } from "next/headers";
import { signOut } from "@/auth";
import { DemoBanner } from "@/components/demo-banner";
import { ScopeToggle } from "@/components/scope-toggle";
import { getSessionAgency, getSessionUser } from "@/lib/data/session";
import { AgencyGate } from "./agency-gate";
import { AgencyTabs } from "./agency-tabs";
import { SwipeNav } from "./swipe-nav";

// 소속사 센터는 로그인 뒤 비공개 앱 화면 → 색인 제외
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const PLAN_LABEL: Record<string, string> = {
  free: "무료",
  growth: "Growth",
  enterprise: "Enterprise",
};

export default async function AgencyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, agency, cookieStore] = await Promise.all([
    getSessionUser(),
    getSessionAgency(),
    cookies(),
  ]);
  // 인증 완료된 소속사만 실제 콘솔. 비로그인 + 둘러보기 쿠키면 데모 콘솔(샘플 데이터).
  const verified = agency?.verificationStatus === "verified";
  const demo = !user && cookieStore.get("xong-demo")?.value === "1";
  const showConsole = verified || demo;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-black tracking-tight">소속사 센터</h1>
        <div className="flex items-center gap-3">
          {verified && <ScopeToggle />}
          <span className="hidden items-center gap-1.5 text-sm text-neutral-400 sm:inline-flex">
            {demo
              ? "둘러보기 · 샘플 소속사"
              : (agency?.companyName ?? "소속사 미인증")}
            {verified && agency && (
              <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-bold text-white">
                {PLAN_LABEL[agency.plan] ?? agency.plan}
              </span>
            )}
          </span>
          {user && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="rounded-lg border border-neutral-200 px-2.5 py-1 text-xs font-semibold text-neutral-500 transition-colors hover:border-neutral-900 hover:text-neutral-900"
              >
                로그아웃
              </button>
            </form>
          )}
        </div>
      </div>
      <p className="mb-5 text-sm text-neutral-500">
        아티스트 프로필, 일정, 섭외 요청을 한 곳에서 관리하세요
      </p>
      <AgencyTabs />
      {showConsole ? (
        <SwipeNav>
          <div className="pt-6">
            {demo && <DemoBanner />}
            {children}
          </div>
        </SwipeNav>
      ) : (
        <div className="pt-6">
          <AgencyGate agency={agency} />
        </div>
      )}
    </div>
  );
}
