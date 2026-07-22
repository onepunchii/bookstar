import Link from "next/link";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/premium/eyebrow";
import { PremiumCTA } from "@/components/premium/premium-cta";
import { Reveal } from "@/components/premium/reveal";
import { getPublicBundle } from "@/lib/data/bundles";
import { formatBudget } from "@/lib/types";
import { getT } from "@/lib/i18n/server";
import { ArrowLeft, ChevronRight, Package, Percent } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, locale } = await getT();
  const { id } = await params;
  const bundle = await getPublicBundle(id);
  if (!bundle) notFound();

  return (
    <div className="adv-dark min-h-dvh">
      <div className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-white/50 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> {t("sets.backHome")}
        </Link>

        {/* 세트 헤더 */}
        <Reveal>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-brand-500" />
            <Eyebrow>{t("sets.artistCount", { count: bundle.artists.length })}</Eyebrow>
            {bundle.discountPct ? (
              <span className="flex items-center gap-0.5 rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-bold text-white">
                <Percent className="h-3 w-3" />
                {t("sets.discountBadge", { pct: bundle.discountPct })}
              </span>
            ) : null}
          </div>
          <h1 className="display-kr mt-3 text-3xl font-black text-white sm:text-4xl">
            {bundle.title}
          </h1>
          {bundle.subtitle && (
            <p className="mt-2 text-sm text-white/55">{bundle.subtitle}</p>
          )}

          {bundle.eventTypes.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {bundle.eventTypes.map((opt) => (
                <span
                  key={opt}
                  className="rounded-full bg-white/8 px-3 py-1 text-xs font-medium text-white/70"
                >
                  {opt}
                </span>
              ))}
            </div>
          )}
        </Reveal>

        {/* 구성 아티스트 */}
        <Reveal delay={80} className="mt-8">
          <p className="mb-3 text-sm font-bold text-white/80">{t("sets.artistsLabel")}</p>
          <div className="space-y-2.5">
            {bundle.artists.map((a) => (
              <Link
                key={a.id}
                href={a.slug ? `/p/${a.slug}` : "#"}
                className="adv-card adv-card-hover flex items-center gap-4 rounded-2xl p-4"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/[0.06]">
                  {a.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.imageUrl}
                      alt={a.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl font-black text-white/30">
                      {a.name.slice(0, 1)}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-white">{a.name}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-white/25" />
              </Link>
            ))}
          </div>
        </Reveal>

        {/* 세트 예산 + CTA */}
        <Reveal delay={140} className="mt-8">
          <div className="adv-card rounded-[1.75rem] p-6">
            {bundle.budgetMax ? (
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-white/40">{t("sets.budgetLabel")}</span>
                <span className="text-2xl font-black text-white">
                  {formatBudget(bundle.budgetMin ?? 0, locale)}
                  <span className="text-base font-bold text-white/30"> ~ </span>
                  {formatBudget(bundle.budgetMax, locale)}
                </span>
              </div>
            ) : null}
            {bundle.discountPct ? (
              <p className="mt-1.5 text-right text-xs text-brand-300">
                {t("sets.discountNote", { pct: bundle.discountPct })}
              </p>
            ) : null}
            <div className="mt-5">
              <PremiumCTA
                href={`/booking/new?set=${bundle.id}`}
                variant="solid"
                className="w-full justify-center"
              >
                {t("sets.cta")}
              </PremiumCTA>
            </div>
            <p className="mt-3 text-center text-xs text-white/40">
              {t("sets.ctaNote")}
            </p>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
