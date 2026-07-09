import type { Metadata } from "next";
import { getSessionArtistId } from "@/lib/data/session";
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
  // 크리에이터로 등록된 계정만 콘솔 — 미등록은 등록 안내 게이트
  const artistId = await getSessionArtistId();
  if (!artistId) return <MeGate />;
  return <>{children}</>;
}
