import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { getT } from "@/lib/i18n/server";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";

export const metadata = {
  title: "xong 가입 · eXperience ON",
  description:
    "브랜드가 당신을 직접 찾아오게 하세요. 크리에이터·인플루언서·소속사를 위한 가장 빠른 부킹 채널.",
  alternates: { canonical: "/join" },
};

export default async function JoinLandingPage() {
  const { t } = await getT();
  return (
    <div className="min-h-dvh bg-white">
      {/* 헤더 */}
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label={t("join.homeAriaLabel")}>
            <Wordmark height={22} />
          </Link>
          <Link
            href="/"
            className="text-sm font-semibold text-neutral-500 hover:text-neutral-900"
          >
            {t("join.browseCta")}
          </Link>
        </div>
      </header>

      {/* 히어로 */}
      <section className="border-b border-neutral-100 bg-gradient-to-b from-brand-50/40 to-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
            <Zap className="h-3 w-3" /> {t("join.betaBadge")}
          </span>
          <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight sm:text-5xl">
            {t("join.heroTitlePre")}{" "}
            <span className="text-brand-500">{t("join.heroTitleEmphasis")}</span>{" "}
            {t("join.heroTitlePost")}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-neutral-600">
            {t("join.heroSubtitle")}
          </p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-brand-500" /> {t("join.benefitDirect")}
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-brand-500" /> {t("join.benefitAllInOne")}
            </span>
            <span className="flex items-center gap-1.5">
              <BadgeCheck className="h-4 w-4 text-brand-500" /> {t("join.benefitFree")}
            </span>
          </div>
        </div>
      </section>

      {/* 페르소나 선택 */}
      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <p className="text-sm font-bold text-neutral-500">
          {t("join.personaPrompt")}
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* 크리에이터 */}
          <Link
            href="/join/creator"
            className="group relative overflow-hidden rounded-3xl border-2 border-brand-500 bg-gradient-to-br from-brand-500 to-brand-700 p-7 text-white transition-transform hover:-translate-y-0.5"
          >
            <span className="absolute right-4 top-4 rounded-full bg-white px-2 py-0.5 text-[10px] font-black text-brand-600">
              {t("join.recommended")}
            </span>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
              <UserRound className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-2xl font-black">
              {t("join.creatorCardTitle")}
              <br />
              {t("join.creatorCardSubtitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-white/85">
              {t("join.creatorCardBody")}
            </p>
            <ul className="mt-5 space-y-1.5 text-sm">
              {[
                t("join.creatorFeature1"),
                t("join.creatorFeature2"),
                t("join.creatorFeature3"),
              ].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-white/80" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold">
              {t("join.creatorCta")} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>

          {/* 소속사 */}
          <Link
            href="/join/agency"
            className="group rounded-3xl border-2 border-neutral-200 bg-white p-7 transition-colors hover:border-neutral-900"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-neutral-900 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-2xl font-black">
              {t("join.agencyCardTitle")}
              <br />
              {t("join.agencyCardSubtitle")}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              {t("join.agencyCardBody")}
            </p>
            <ul className="mt-5 space-y-1.5 text-sm text-neutral-600">
              {[
                t("join.agencyFeature1"),
                t("join.agencyFeature2"),
                t("join.agencyFeature3"),
              ].map((line) => (
                <li key={line} className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-bold text-neutral-900">
              {t("join.agencyCta")} <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400">
          {t("join.alreadyMember")}{" "}
          <Link href="/" className="font-semibold text-neutral-900">
            {t("common.login")}
          </Link>
        </p>
      </section>
    </div>
  );
}
