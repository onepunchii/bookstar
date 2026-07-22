// 크리에이터 미등록 게이트 — 등록 전엔 /me 어느 탭이든 안내 노출.
import Link from "next/link";
import { ArrowRight, Sparkles, UserRound } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export async function MeGate() {
  const { t } = await getT();
  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-900 text-white">
        <UserRound className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-black text-neutral-900">
        {t("me.gate.title")}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-neutral-500">
        {t("me.gate.desc")}
      </p>
      <p className="mt-1.5 text-xs font-medium text-brand-600">
        {t("me.gate.manageLine")}
      </p>

      <Link
        href="/join/creator"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
      >
        <Sparkles className="h-4 w-4" /> {t("me.gate.registerCta")}{" "}
        <ArrowRight className="h-4 w-4" />
      </Link>
      <div className="mt-4">
        <Link
          href="/"
          className="text-sm font-semibold text-neutral-400 hover:text-neutral-700"
        >
          {t("me.gate.advertiserHome")}
        </Link>
      </div>
    </div>
  );
}
