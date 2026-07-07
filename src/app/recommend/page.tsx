import { CastingRecommender } from "./recommender";

export const metadata = {
  title: "AI 캐스팅 추천 · BOOKSTAR",
};

export default function RecommendPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
          BETA
        </span>
        <h1 className="mt-2 text-2xl font-black tracking-tight">
          AI 캐스팅 추천
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          예산·카테고리·이미지를 입력하면 규칙 기반으로 매칭도 높은 아티스트를
          찾아드려요
        </p>
      </div>
      <CastingRecommender />
    </div>
  );
}
