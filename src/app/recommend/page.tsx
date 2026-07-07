import { Eyebrow } from "@/components/premium/eyebrow";
import { Reveal } from "@/components/premium/reveal";
import { Sparkles } from "lucide-react";
import { CastingRecommender } from "./recommender";

export const metadata = {
  title: "AI 캐스팅 추천 · xong",
};

export default function RecommendPage() {
  return (
    <div className="bg-white">
      {/* 프리미엄 헤더 밴드 */}
      <section className="relative overflow-hidden border-b border-neutral-100">
        <div
          aria-hidden
          className="float-orb pointer-events-none absolute -right-20 -top-16 h-72 w-72 rounded-full bg-brand-100/50 blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
          <Reveal>
            <Eyebrow>
              <Sparkles className="h-3 w-3" /> AI Casting · Beta
            </Eyebrow>
            <h1 className="display-kr mt-4 text-3xl font-black sm:text-[2.75rem]">
              조건만 넣으면
              <br />
              <span className="text-neutral-400">
                딱 맞는 캐스팅을 찾아드려요
              </span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-neutral-500 sm:text-base">
              예산·카테고리·이미지 태그로 매칭도 높은 아티스트를 5초 만에.
              단순 필터가 아니라, 왜 이 아티스트가 맞는지 이유까지
              보여드립니다.
            </p>
          </Reveal>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8">
        <CastingRecommender />
      </div>
    </div>
  );
}
