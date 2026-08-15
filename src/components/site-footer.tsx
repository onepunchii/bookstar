// 사이트 푸터 — 공개 페이지(홈·아티스트·소개·앱 랜딩) 하단 상시 노출 영역.
//
// ★ 존재 이유: Play·App Store 페이지는 구글 **웹 검색에 색인되는 웹페이지**다.
//   색인이 이미 잡힌 우리 사이트에서 크롤러가 볼 수 있는 실링크를 걸면 그 스토어
//   페이지의 검색 노출에 도움이 된다. 기존 패밀리 카드는 클라이언트에서 기기 감지로
//   링크를 갈아 끼우기 때문에 서버 HTML 에 스토어 링크가 남지 않았다 — 그 보완이다.
//
// 서버 컴포넌트다(getT). 스토어 배지만 "use client" 로 분리돼 있는데, 네이티브 앱
// 안에서 숨겨야 하기 때문이다(store-badges.tsx 주석 참고). SSR 되므로 서버 HTML 에는
// 두 링크가 항상 들어간다.
//
// 다크 전용이다 — 이 푸터가 붙는 공개 페이지는 모두 광고주(company) 다크 크롬이다.
import Link from "next/link";
import { StoreBadges } from "./store-badges";
import { getT } from "@/lib/i18n/server";

export async function SiteFooter() {
  const { t } = await getT({ botDefault: "ko" });

  return (
    <footer className="mt-16 border-t border-white/8 sm:mt-24">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          {/* 앱 받기 — 스토어 실링크 */}
          <div>
            <p className="text-sm font-bold text-white">{t("install.cta")}</p>
            <p className="mt-1 text-xs text-white/40">
              {t("bookingTopic.footerTagline")}
            </p>
            <div className="mt-4">
              <StoreBadges placement="web_footer" />
            </div>
            <Link
              href="/app"
              className="mt-3 inline-block text-xs font-semibold text-brand-400 hover:text-brand-300"
            >
              {t("footer.appPage")}
            </Link>
          </div>

          {/* 사이트 내부 링크 */}
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/45">
            <Link href="/artists" className="hover:text-white/80">
              {t("bookingTopic.findArtist")}
            </Link>
            <Link href="/guide" className="hover:text-white/80">
              {t("guide.navGuide")}
            </Link>
            <Link href="/about" className="hover:text-white/80">
              {t("about.crumbCurrent")}
            </Link>
            <Link href="/join" className="hover:text-white/80">
              {t("guide.footerFreeStart")}
            </Link>
            <Link href="/terms" className="hover:text-white/80">
              {t("common.terms")}
            </Link>
            <Link href="/privacy" className="hover:text-white/80">
              {t("common.privacy")}
            </Link>
          </nav>
        </div>

        <p className="mt-8 text-[11px] text-white/25">
          © 2026 XONG · www.xong.co.kr
        </p>
      </div>
    </footer>
  );
}
