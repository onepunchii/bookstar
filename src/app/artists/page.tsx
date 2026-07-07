import Link from "next/link";
import { ArtistCard } from "@/components/artist-card";
import { ARTISTS, SCHEDULES } from "@/lib/mock-data";
import { parseNL } from "@/lib/nl-search";
import { CATEGORY_LABELS, type ArtistCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import { SearchBar } from "./search-bar";

const BUDGET_FILTERS = [
  { key: "all", label: "전체 예산", min: 0, max: Infinity },
  { key: "u1000", label: "1천만원 이하", min: 0, max: 1000 },
  { key: "1000-5000", label: "1천~5천만원", min: 1000, max: 5000 },
  { key: "o5000", label: "5천만원 이상", min: 5000, max: Infinity },
];

function hasAvailabilityInRange(artistId: string, start: string, end: string) {
  const days = SCHEDULES[artistId] ?? [];
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
  const { category, q, budget } = await searchParams;
  const budgetFilter =
    BUDGET_FILTERS.find((b) => b.key === budget) ?? BUDGET_FILTERS[0];

  // 자연어 파싱
  const nl = q ? parseNL(q) : undefined;

  const filtered = ARTISTS.filter((a) => {
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
      if (nl.dateRange && !hasAvailabilityInRange(a.id, nl.dateRange.start, nl.dateRange.end))
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
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">아티스트 찾기</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {filtered.length}팀의 아티스트가 섭외를 기다리고 있어요 · &lsquo;다음주
        가능한 여자 아이돌&rsquo; 같은 자연어로 검색해보세요
      </p>

      <div className="mt-6">
        <SearchBar defaultValue={q} />
      </div>

      {/* AI가 이해한 조건 chip strip */}
      {nl && nl.chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/50 px-3 py-2">
          <span className="flex items-center gap-1 text-xs font-bold text-brand-700">
            <Sparkles className="h-3 w-3" /> AI가 이해한 조건
          </span>
          {nl.chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-neutral-700 ring-1 ring-brand-200"
            >
              {chip}
            </span>
          ))}
        </div>
      )}

      {/* Category filter */}
      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={buildQuery({ category: undefined })}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            !category
              ? "bg-neutral-900 text-white"
              : "border border-neutral-200 text-neutral-600 hover:border-neutral-900"
          )}
        >
          전체
        </Link>
        {(Object.keys(CATEGORY_LABELS) as ArtistCategory[]).map((c) => (
          <Link
            key={c}
            href={buildQuery({ category: c })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              category === c
                ? "bg-neutral-900 text-white"
                : "border border-neutral-200 text-neutral-600 hover:border-neutral-900"
            )}
          >
            {CATEGORY_LABELS[c]}
          </Link>
        ))}
      </div>

      {/* Budget filter */}
      <div className="mt-2 flex flex-wrap gap-2">
        {BUDGET_FILTERS.map((b) => (
          <Link
            key={b.key}
            href={buildQuery({ budget: b.key === "all" ? undefined : b.key })}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              budgetFilter.key === b.key
                ? "bg-brand-500 text-white"
                : "border border-neutral-200 text-neutral-600 hover:border-brand-500 hover:text-brand-600"
            )}
          >
            {b.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-neutral-300 py-20 text-center">
          <p className="font-semibold text-neutral-700">
            조건에 맞는 아티스트가 없어요
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            필터를 조정하거나, AI 캐스팅 추천으로 조건에 맞는 아티스트를
            찾아보세요
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
      )}
    </div>
  );
}
