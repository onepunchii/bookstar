import type { Metadata } from "next";
import { cookies } from "next/headers";
import { DemoBanner } from "@/components/demo-banner";
import { getSessionArtistId, getSessionUser } from "@/lib/data/session";
import { MeGate } from "./me-gate";

// 아티스트 개인 화면 → 색인 제외
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [artistId, user, cookieStore] = await Promise.all([
    getSessionArtistId(),
    getSessionUser(),
    cookies(),
  ]);
  // 크리에이터로 등록된 계정만 콘솔. 비로그인 + 둘러보기 쿠키면 데모(샘플 데이터).
  const demo = !user && cookieStore.get("xong-demo")?.value === "1";
  if (!artistId && !demo) return <MeGate />;
  return (
    <>
      {demo && (
        <div className="mx-auto max-w-2xl px-4 pt-6 sm:px-6">
          <DemoBanner />
        </div>
      )}
      {children}
    </>
  );
}
