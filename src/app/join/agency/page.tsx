import Link from "next/link";
import { Wordmark } from "@/components/wordmark";
import { getT } from "@/lib/i18n/server";
import { Building2, Mail, Phone, Sparkles } from "lucide-react";

export const metadata = {
  title: "소속사 등록 · xong",
  description:
    "소속 아티스트를 등록하고 섭외 요청을 한 곳에서 관리하세요. 등록 즉시 공개 프로필이 검색에 노출됩니다. 매칭 수수료 0%.",
  alternates: { canonical: "/join/agency" },
};

export default async function AgencyJoinPage() {
  const { t } = await getT();
  return (
    <div className="min-h-dvh bg-white">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 sm:px-6">
          <Link href="/join" aria-label={t("join.agency.backToStart")}>
            <Wordmark height={20} />
          </Link>
          <Link
            href="/join/creator"
            className="text-xs font-semibold text-neutral-400 hover:text-neutral-900"
          >
            {t("join.agency.registerAsCreator")}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white">
          <Building2 className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-center text-3xl font-black tracking-tight">
          {t("join.agency.title")}
        </h1>
        <p className="mt-3 text-center leading-relaxed text-neutral-600">
          {t("join.agency.lead")}
          <br />
          {t("join.agency.turnaroundPrefix")}{" "}
          <span className="font-bold text-neutral-900">
            {t("join.agency.turnaroundDays")}
          </span>{" "}
          {t("join.agency.turnaroundSuffix")}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a
            href="mailto:hello@xong.co.kr?subject=xong%20%EC%86%8C%EC%86%8D%EC%82%AC%20%EC%9E%85%EC%A0%90%20%EB%AC%B8%EC%9D%98"
            className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Mail className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold">{t("join.agency.emailInquiry")}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                hello@xong.co.kr
              </p>
            </div>
          </a>
          <a
            href="tel:+8225551234"
            className="group flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-900"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 text-white">
              <Phone className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-sm font-bold">{t("join.agency.phoneInquiry")}</p>
              <p className="mt-0.5 text-xs text-neutral-500">02-555-1234</p>
            </div>
          </a>
        </div>

        <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-6">
          <p className="flex items-center gap-1.5 text-sm font-bold text-neutral-900">
            <Sparkles className="h-4 w-4 text-brand-500" />{" "}
            {t("join.agency.recommendTitle")}
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-neutral-600">
            <li>{t("join.agency.recommend1")}</li>
            <li>{t("join.agency.recommend2")}</li>
            <li>{t("join.agency.recommend3")}</li>
          </ul>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-400">
          {t("join.agency.demoPrompt")}{" "}
          <Link href="/" className="font-semibold text-neutral-900">
            {t("join.agency.demoCta")}
          </Link>
        </p>
      </div>
    </div>
  );
}
