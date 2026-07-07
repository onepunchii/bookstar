"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { RatingStars } from "@/components/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
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

  return (
    <div className="space-y-6">
      {/* 폼 */}
      <Card className="space-y-5 p-6">
        <div>
          <Label htmlFor="rec-budget">예산 (만원)</Label>
          <Input
            id="rec-budget"
            type="number"
            value={budget}
            onChange={(e) => {
              setBudget(e.target.value);
              setSubmitted(false);
            }}
            placeholder="예: 3000"
          />
        </div>

        <div>
          <Label>카테고리 (복수 선택 가능)</Label>
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
                  "flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  categories.includes(c)
                    ? "bg-brand-500 text-white"
                    : "border border-neutral-200 text-neutral-600 hover:border-brand-500"
                )}
              >
                {categories.includes(c) && <Check className="h-3 w-3" />}
                {CATEGORY_LABELS[c]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>성별</Label>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["any", "무관"],
                ["female", "여성"],
                ["male", "남성"],
                ["group", "그룹"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  setGender(v);
                  setSubmitted(false);
                }}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  gender === v
                    ? "bg-neutral-900 text-white"
                    : "border border-neutral-200 text-neutral-600 hover:border-neutral-900"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>이미지 · 브랜드 태그 (복수 선택)</Label>
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
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  tags.includes(t)
                    ? "border-brand-500 bg-brand-50 text-brand-700"
                    : "border-neutral-200 text-neutral-600 hover:border-brand-500"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <Button
          size="lg"
          onClick={() => setSubmitted(true)}
          className="w-full"
        >
          <Sparkles className="h-4 w-4" />
          매칭 아티스트 찾기
        </Button>
      </Card>

      {/* 결과 */}
      {submitted && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-neutral-500">
            추천 결과 ({results.length}팀)
          </h2>
          {results.length === 0 ? (
            <Card className="py-12 text-center">
              <p className="font-semibold">조건에 맞는 아티스트가 없어요</p>
              <p className="mt-1 text-sm text-neutral-400">
                카테고리·태그를 조정하거나 예산 범위를 넓혀보세요
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => {
                const rating = getRatingSummary(r.artist.id);
                return (
                  <Card
                    key={r.artist.id}
                    className={cn(
                      "p-5 transition-colors hover:border-neutral-900",
                      i === 0 && "border-brand-500 ring-1 ring-brand-500/20"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-brand-50 text-xl font-black text-neutral-300">
                        {r.artist.name.slice(0, 1)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {i === 0 && (
                            <Badge variant="solid">Best Match</Badge>
                          )}
                          <span className="font-bold">{r.artist.name}</span>
                          <span className="text-xs text-neutral-400">
                            {r.artist.agencyName}
                          </span>
                          {rating.count > 0 && (
                            <span className="flex items-center gap-1">
                              <RatingStars value={rating.avg} size="sm" />
                              <span className="text-xs font-semibold">
                                {rating.avg.toFixed(1)}
                              </span>
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-sm text-neutral-500">
                          {r.artist.tagline}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {r.reasons.slice(0, 3).map((reason) => (
                            <li
                              key={reason}
                              className="flex items-center gap-1.5 text-xs text-neutral-600"
                            >
                              <Check className="h-3 w-3 text-brand-500" />
                              {reason}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-xs text-neutral-400">
                          팔로워 {formatFollowers(r.artist.followers)} · 예산대{" "}
                          {formatBudget(r.artist.budgetRange[0])}~
                          {formatBudget(r.artist.budgetRange[1])}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="text-2xl font-black text-brand-600">
                          {r.score}
                          <span className="ml-0.5 text-xs font-bold text-neutral-400">
                            점
                          </span>
                        </span>
                        <Link
                          href={`/artists/${r.artist.id}`}
                          className="flex items-center gap-1 text-xs font-semibold text-neutral-600 hover:text-neutral-900"
                        >
                          프로필 <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
