import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "BOOKSTAR — 연예인 섭외, 가장 빠른 연결",
  description:
    "광고주·대행사·행사기획사를 위한 B2B 부킹 플랫폼. 가능 일정 확인부터 섭외 요청, 협의, 계약까지 한 곳에서.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full bg-white text-neutral-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
