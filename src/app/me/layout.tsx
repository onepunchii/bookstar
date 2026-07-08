import type { Metadata } from "next";

// 아티스트 개인 화면 → 색인 제외
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function MeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
