import { Eyebrow } from "@/components/premium/eyebrow";
import { Reveal } from "@/components/premium/reveal";
import { getPublicArtists } from "@/lib/data/artists";
import { getT } from "@/lib/i18n/server";
import { Sparkles } from "lucide-react";
import { CastingRecommender } from "./recommender";

export const metadata = {
  title: "AI 캐스팅 추천 · xong",
  robots: { index: false, follow: false },
};

export default async function RecommendPage() {
  const artists = await getPublicArtists();
  const { t } = await getT();
  return (
    <div className="adv-dark">
      {/* 프리미엄 헤더 밴드 */}
      <section className="relative overflow-hidden border-b border-white/8">
        <div
          aria-hidden
          className="adv-orb float-orb pointer-events-none absolute -right-20 -top-16 h-80 w-80 rounded-full blur-2xl"
        />
        <div className="relative mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
          <Reveal>
            <Eyebrow>
              <Sparkles className="h-3 w-3" /> AI Casting · Beta
            </Eyebrow>
            <h1 className="display-kr mt-4 text-3xl font-black text-white sm:text-[2.75rem]">
              {t("recommend.heroTitleTop")}
              <br />
              <span className="text-white/35">
                {t("recommend.heroTitleBottom")}
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/55 sm:text-base">
              {t("recommend.heroDesc")}
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <Reveal>
          <CastingRecommender artists={artists} />
        </Reveal>
      </div>
    </div>
  );
}
