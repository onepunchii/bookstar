import type { Metadata } from "next";

// 섭외 요청 관리 화면 → 색인 제외
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function RequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
