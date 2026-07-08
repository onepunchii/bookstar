import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { SITE } from "@/lib/site";

export const viewport: Viewport = {
  // 스플래시·주소창 배경 블랙
  themeColor: "#000000",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "XONG",
    statusBarStyle: "black-translucent",
  },
  title: {
    default: "xong · 연예인·인플루언서 섭외 — eXperience ON",
    template: "%s · xong",
  },
  description: SITE.description,
  keywords: [...SITE.keywords],
  applicationName: "XONG",
  authors: [{ name: SITE.name, url: SITE.url }],
  creator: SITE.name,
  publisher: SITE.name,
  alternates: { canonical: "/" },
  icons: {
    icon: [{ url: "/app.png", type: "image/png" }],
    shortcut: "/app.png",
    apple: "/app.png",
  },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: SITE.locale,
    url: SITE.url,
    title: "xong · 연예인·인플루언서 섭외 — eXperience ON",
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    site: SITE.twitter,
    title: "xong · 연예인·인플루언서 섭외",
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
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
