"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RatingStars } from "@/components/rating-stars";
import { getRatingSummary } from "@/lib/mock-data";
import { recommend } from "@/lib/recommend";
import {
  CATEGORY_LABELS,
  formatBudget,
  formatFollowers,
  type ArtistCategory,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, Sparkles } from "lucide-react";

const TAG_SUGGESTIONS = [
  "뷰티",
  "패션",
  "럭셔리",
  "F&B",
  "스포츠",
  "IT",
  "금융",
  "라이프스타일",
  "3040",
  "10-20대",
  "프리미엄",
  "축제",
];

export function CastingRecommender() {
  const [budget, setBudget] = useState<string>("3000");
  const [categories, setCategories] = useState<ArtistCategory[]>([]);
  const [gender, setGender] = useState<"any" | "male" | "female" | "group">(
    "any"
  );
  const [tags, setTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleCategory = (c: ArtistCategory) =>
    setCategories((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  const toggleTag = (t: string) =>
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  const results = useMemo(() => {
    if (!submitted) return [];
    return recommend({
      budget: Number(budget) || 0,
      categories,
      gender,
      tags,
    });
  }, [submitted, budget, categories, gender, tags]);

  const label = "mb-1.5 block text-sm font-medium text-white/70";

  return (
    <div className="space-y-6">
      {/* 폼 */}
      <div className="adv-card space-y-5 rounded-[1.75rem] p-6 sm:p-7">
        <div>
          <label htmlFor="rec-budget" className={label}>
            예산 (만원)
          </label>
          <input
            id="rec-budget"
            type="number"
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value);
              setSubmitted(false);
            }}
            placeholder="예: 3000"
            className="adv-glass h-11 w-full rounded-xl px-3.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-brand-500/50"
          />
        </div>

        <div>
          <p className={label}>카테고리 (복수 선택 가능)</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(CATEGORY_LABELS) as ArtistCategory[]).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  toggleCategory(c);
                  setSubmitted(false);
                }}
                className={cn(
                  "premium-ease flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium",
                  categories.includes(c)
                    ? "bg-brand-500 text-white"
                    : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:text-white"
                )}
              >
                {categories.includes(c) && <Check className="h-3 w-3" />}
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={label}>성별</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["any", "무관"],
                ["female", "여성"],
                ["male", "남성"],
                ["group", "그룹"],
              ] as const
            ).map(([v, txt]) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setGender(v);
                  setSubmitted(false);
                }}
                className={cn(
                  "premium-ease rounded-full px-4 py-1.5 text-sm font-medium",
                  gender === v
                    ? "bg-white text-neutral-900"
                    : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:text-white"
                )}
              >
                {txt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className={label}>이미지 · 브랜드 태그 (복수 선택)</p>
          <div className="flex flex-wrap gap-1.5">
            {TAG_SUGGESTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  toggleTag(t);
                  setSubmitted(false);
                }}
                className={cn(
                  "premium-ease rounded-full px-3 py-1 text-xs font-medium",
                  tags.includes(t)
                    ? "bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/40"
                    : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:text-white"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setSubmitted(true)}
          className="premium-ease flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-sm font-bold text-white hover:bg-brand-600 hover:brand-glow"
        >
          <Sparkles className="h-4 w-4" />
          매칭 아티스트 찾기
        </button>
      </div>

      {/* 결과 */}
      {submitted && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-white/50">
            추천 결과 ({results.length}팀)
          </h2>
          {results.length === 0 ? (
            <div className="adv-card rounded-2xl py-12 text-center">
              <p className="font-semibold text-white">
                조건에 맞는 아티스트가 없어요
              </p>
              <p className="mt-1 text-sm text-white/45">
                카테고리·태그를 조정하거나 예산 범위를 넓혀보세요
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => {
                const rating = getRatingSummary(r.artist.id);
                return (
                  <div
                    key={r.artist.id}
                    className={cn(
                      "adv-card adv-card-hover rounded-2xl p-5",
                      i === 0 && "ring-1 ring-brand-500/40"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-xl font-black text-white/40">
                        {r.artist.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {i === 0 && (
                            <span className="rounded-full bg-brand-500 px-2 py-0.5 text-[10px] font-bold text-white">
                              Best Match
                            </span>
                          )}
                          <span className="font-bold text-white">
                            {r.artist.name}
                          </span>
                          <span className="text-xs text-white/40">
                            {r.artist.agencyName}
                          </span>
                          {rating.count > 0 && (
                            <span className="flex items-center gap-1">
                              <RatingStars value={rating.avg} size="sm" />
                              <span className="text-xs font-semibold text-white/70">
                                {rating.avg.toFixed(1)}
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-sm text-white/50">
                          {r.artist.tagline}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {r.reasons.slice(0, 3).map((reason) => (
                            <li
                              key={reason}
                              className="flex items-center gap-1.5 text-xs text-white/65"
                            >
                              <Check className="h-3 w-3 text-brand-500" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-white/40">
                          팔로워 {formatFollowers(r.artist.followers)} · 예산대{" "}
                          {formatBudget(r.artist.budgetRange[0])}~
                          {formatBudget(r.artist.budgetRange[1])}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-2xl font-black text-brand-400">
                          {r.score}
                          <span className="ml-0.5 text-xs font-bold text-white/40">
                            점
                          </span>
                        </span>
                        <Link
                          href={`/artists/${r.artist.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-white/60 hover:text-white"
                        >
                          프로필 <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
