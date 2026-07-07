import Link from "next/link";
import { ArtistCard } from "@/components/artist-card";
import { ARTISTS } from "@/lib/mock-data";
import { CATEGORY_LABELS, type ArtistCategory } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SearchBar } from "./search-bar";

const BUDGET_FILTERS = [
  { key: "all", label: "전체 예산", min: 0, max: Infinity },
  { key: "u1000", label: "1천만원 이하", min: 0, max: 1000 },
  { key: "1000-5000", label: "1천~5천만원", min: 1000, max: 5000 },
  { key: "o5000", label: "5천만원 이상", min: 5000, max: Infinity },
];

export default async function ArtistsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; budget?: string }>;
}) {
  const { category, q, budget } = await searchParams;
  const budgetFilter =
    BUDGET_FILTERS.find((b) => b.key === budget) ?? BUDGET_FILTERS[0];

  const filtered = ARTISTS.filter((a) => {
    if (category && !a.categories.includes(category as ArtistCategory))
      return false;
    if (
      q &&
      ![a.name, a.agencyName, a.tagline, ...a.tags].some((s) =>
        s.toLowerCase().includes(q.toLowerCase())
      )
    )
      return false;
    if (
      budgetFilter.key !== "all" &&
      (a.budgetRange[0] > budgetFilter.max || a.budgetRange[1] < budgetFilter.min)
    )
      return false;
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
        {filtered.length}팀의 아티스트가 섭외를 기다리고 있어요
      </p>

      <div className="mt-6">
        <SearchBar defaultValue={q} />
      </div>

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
            필터를 조정하거나, 원하는 조건으로 공고를 올려 소속사의 지원을
            받아보세요
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
