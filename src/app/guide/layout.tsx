// 섭외 가이드 — 공개 정보성 콘텐츠 허브. 앱 셸 밖 자체 크롬(SEO 랜딩).
import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { getT } from "@/lib/i18n/server";

export default async function GuideLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = await getT();
  return (
    <div className="adv-dark min-h-dvh bg-[#0a0a0b] text-white/90">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#0a0a0b]/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link href="/" aria-label={t("bookingTopic.homeAriaLabel")}>
            <Wordmark height={18} />
          </Link>
          <nav className="flex items-center gap-2">
            <Link
              href="/guide"
              className="rounded-full px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white"
            >
              {t("guide.navGuide")}
            </Link>
            <Link
              href="/artists"
              className="rounded-full bg-brand-500 px-4 py-1.5 text-xs font-bold text-white brand-glow"
            >
              {t("bookingTopic.findArtist")}
            </Link>
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-white/8">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-5 py-8 text-xs text-white/35">
          <span>{t("bookingTopic.footerTagline")}</span>
          <span className="flex gap-4">
            <Link href="/artists" className="hover:text-white/70">
              {t("bookingTopic.findArtist")}
            </Link>
            <Link href="/join" className="hover:text-white/70">
              {t("guide.footerFreeStart")}
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
