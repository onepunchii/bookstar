import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/premium/eyebrow";
import { PremiumArtistCard } from "@/components/premium/premium-artist-card";
import { Reveal } from "@/components/premium/reveal";
import { SLACounter } from "@/components/sla-counter";
import { getPublicArtists, getPublicScheduleMap } from "@/lib/data/artists";
import { getT } from "@/lib/i18n/server";
import { parseNL } from "@/lib/nl-search";
import { CATEGORY_LABELS, type ArtistCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { SearchBar } from "./search-bar";

// 카테고리별 self-canonical — "아이돌 섭외" 등 카테고리 페이지가 각자 색인되도록
// (루트 canonical "/" 상속 제거). 카테고리 없으면 /artists 자기 자신.
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}): Promise<Metadata> {
  const { category } = await searchParams;
  const label =
    category && (CATEGORY_LABELS as Record<string, string>)[category];
  if (label) {
    return {
      title: `${label} 섭외`,
      description: `${label} 섭외 — 검증된 소속사와 직접, 매칭 수수료 0%로 섭외하세요.`,
      alternates: { canonical: `/artists?category=${category}` },
    };
  }
  return {
    title: "아티스트 찾기",
    alternates: { canonical: "/artists" },
  };
}

const BUDGET_FILTERS = [
  { key: "all", labelKey: "artists.browse.budgetAll", min: 0, max: Infinity },
  { key: "u1000", labelKey: "artists.browse.budgetU1000", min: 0, max: 1000 },
  {
    key: "1000-5000",
    labelKey: "artists.browse.budget1000to5000",
    min: 1000,
    max: 5000,
  },
  { key: "o5000", labelKey: "artists.browse.budgetO5000", min: 5000, max: Infinity },
];

function hasAvailabilityInRange(
  days: { date: string; availability: string }[],
  start: string,
  end: string
) {
  return days.some(
    (d) =>
      d.date >= start &&
      d.date <= end &&
      (d.availability === "available" || d.availability === "partial")
  );
}

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; budget?: string }>;
}) {
  const { t } = await getT();
  const { category, q, budget } = await searchParams;
  const budgetFilter =
    BUDGET_FILTERS.find((b) => b.key === budget) ?? BUDGET_FILTERS[0];

  // 자연어 파싱
  const nl = q ? parseNL(q) : undefined;

  const [artists, scheduleMap] = await Promise.all([
    getPublicArtists(),
    getPublicScheduleMap(),
  ]);

  const filtered = artists.filter((a) => {
    if (category && !a.categories.includes(category as ArtistCategory))
      return false;
    if (
      budgetFilter.key !== "all" &&
      (a.budgetRange[0] > budgetFilter.max || a.budgetRange[1] < budgetFilter.min)
    )
      return false;
    if (nl) {
      // NL 카테고리
      if (
        nl.categories.length > 0 &&
        !a.categories.some((c) => nl.categories.includes(c))
      )
        return false;
      // NL 성별 — 아이돌 검색 시 걸그룹/보이그룹 tag 허용
      if (nl.gender && a.gender !== nl.gender) {
        const isFemaleGroup =
          nl.gender === "female" && a.tags.includes("걸그룹");
        const isMaleGroup =
          nl.gender === "male" && a.tags.includes("보이그룹");
        if (!isFemaleGroup && !isMaleGroup) return false;
      }
      // NL 시간 범위 → 가능한 날짜 있는지
      if (
        nl.dateRange &&
        !hasAvailabilityInRange(
          scheduleMap[a.id] ?? [],
          nl.dateRange.start,
          nl.dateRange.end
        )
      )
        return false;
      // NL 남은 키워드 → 이름/소속사/태그 문자열 검색
      if (nl.keywords.length > 0) {
        const haystack = [a.name, a.agencyName, a.tagline, ...a.tags]
          .join(" ")
          .toLowerCase();
        const matched = nl.keywords.some((k) =>
          haystack.includes(k.toLowerCase())
        );
        // 자연어에서 남은 키워드가 있는데 매칭 안 되면 걸러줌
        // (예: '뷰티' 라는 키워드가 남았다면 그것에 매칭되지 않는 아티스트 제외)
        // 단 chips가 이미 있으면 잔여 키워드는 옵션 취급
        if (nl.chips.length === 0 && !matched) return false;
        if (nl.chips.length > 0 && nl.keywords.length > 1 && !matched)
          return false;
      }
    }
    return true;
  });

  const buildQuery = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    const merged = { category, q, budget, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) params.set(k, v);
    const s = params.toString();
    return s ? `/artists?${s}` : "/artists";
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <Reveal>
        <Eyebrow>Discover</Eyebrow>
        <h1 className="display-kr mt-3 text-3xl font-black text-white sm:text-4xl">
          {t("artists.browse.title")}
        </h1>
        <p className="mt-2 text-sm text-white/50 sm:text-base">
          {t("artists.browse.subtitle", { count: filtered.length })}
        </p>
      </Reveal>

      <Reveal delay={60} className="mt-6">
        <SLACounter variant="inline" dark artists={artists} />
      </Reveal>

      <Reveal delay={90} className="mt-4">
        <SearchBar defaultValue={q} dark />
      </Reveal>

      {/* AI가 이해한 조건 chip strip */}
      {nl && nl.chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-brand-500/30 bg-brand-500/10 px-3 py-2">
          <span className="flex items-center gap-1 text-xs font-bold text-brand-300">
            <Sparkles className="h-3 w-3" /> {t("artists.browse.aiUnderstood")}
          </span>
          {nl.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-semibold text-white/85 ring-1 ring-brand-500/30"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Category filter */}
      <div className="mt-4 flex gap-2 overflow-x-auto hide-scrollbar">
        <Link
          href={buildQuery({ category: undefined })}
          className={cn(
            "premium-ease shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium",
            !category
              ? "bg-white text-neutral-900"
              : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:text-white"
          )}
        >
          {t("artists.browse.categoryAll")}
        </Link>
        {(Object.keys(CATEGORY_LABELS) as ArtistCategory[]).map((c) => (
          <Link
            key={c}
            href={buildQuery({ category: c })}
            className={cn(
              "premium-ease shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium",
              category === c
                ? "bg-white text-neutral-900"
                : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:text-white"
            )}
          >
            {t(`category.${c}`)}
          </Link>
        ))}
      </div>

      {/* Budget filter */}
      <div className="mt-2 flex gap-2 overflow-x-auto hide-scrollbar">
        {BUDGET_FILTERS.map((b) => (
          <Link
            key={b.key}
            href={buildQuery({ budget: b.key === "all" ? undefined : b.key })}
            className={cn(
              "premium-ease shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium",
              budgetFilter.key === b.key
                ? "bg-brand-500 text-white"
                : "bg-white/5 text-white/60 ring-1 ring-white/10 hover:text-brand-300 hover:ring-brand-500/30"
            )}
          >
            {t(b.labelKey)}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-white/15 py-20 text-center">
          <p className="font-semibold text-white/80">
            {t("artists.browse.emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-white/45">
            {t("artists.browse.emptyDesc")}
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {filtered.map((artist, i) => (
            <Reveal key={artist.id} delay={(i % 4) * 60}>
              <PremiumArtistCard artist={artist} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
