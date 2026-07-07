import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "xong — eXperience ON",
  description:
    "연예인·인플루언서 섭외를 가장 빠르게 연결하는 B2B 부킹 OS. 가능 일정 확인부터 섭외 요청, 협의, 계약, 정산까지 한 곳에서.",
  icons: {
    icon: "/xong1.webp",
  },
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
