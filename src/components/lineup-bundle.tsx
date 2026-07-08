import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getArtist } from "@/lib/mock-data";
import { formatBudget, type Artist, type LineupBundle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowRight, Package } from "lucide-react";

interface Props {
  bundle: LineupBundle;
  dbArtists?: Artist[];
  className?: string;
  dark?: boolean;
}

export function LineupBundleCard({
  bundle,
  dbArtists = [],
  className,
  dark = false,
}: Props) {
  // 번들 멤버(mock id) → 슬러그로 DB 아티스트 매칭(사진·실데이터). 없으면 목.
  const artists = bundle.artistIds
    .map((id) => {
      const mock = getArtist(id);
      if (!mock) return undefined;
      return dbArtists.find((a) => a.slug === mock.slug) ?? mock;
    })
    .filter(Boolean) as Artist[];

  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 text-brand-500" />
            <span className="text-xs font-bold text-brand-500">
              {artists.length}인 세트
            </span>
            {bundle.discountPct && (
              <Badge variant="solid">-{bundle.discountPct}%</Badge>
            )}
          </div>
          <h3 className={cn("mt-1 text-base font-black", dark && "text-white")}>
            {bundle.title}
          </h3>
          <p className={cn("mt-0.5 text-xs", dark ? "text-white/45" : "text-neutral-500")}>
            {bundle.subtitle}
          </p>
        </div>
        <ArrowRight
          className={cn(
            "premium-ease h-4 w-4 shrink-0",
            dark
              ? "text-white/30 group-hover:text-white"
              : "text-neutral-300 group-hover:text-neutral-900"
          )}
        />
      </div>

      {/* 아티스트 썸네일 스택 */}
      <div className="mt-4 flex -space-x-2">
        {artists.map((a) =>
          a.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={a.id}
              src={a.imageUrl}
              alt={a.name}
              title={a.name}
              className={cn(
                "h-10 w-10 rounded-full object-cover ring-2",
                dark ? "ring-[#141416]" : "ring-white"
              )}
            />
          ) : (
            <div
              key={a.id}
              title={a.name}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full text-sm font-black",
                dark
                  ? "bg-white/10 text-white/70 ring-2 ring-[#141416]"
                  : "bg-gradient-to-br from-neutral-100 to-brand-50 text-neutral-400 ring-2 ring-white"
              )}
            >
              {a.name.slice(0, 1)}
            </div>
          )
        )}
      </div>

      <div
        className={cn(
          "mt-3 flex flex-wrap items-center gap-1.5 text-xs",
          dark ? "text-white/70" : "text-neutral-600"
        )}
      >
        {artists.map((a, i) => (
          <span key={a.id} className="flex items-center gap-1.5">
            {i > 0 && (
              <span className={dark ? "text-white/25" : "text-neutral-300"}>·</span>
            )}
            <span className="font-semibold">{a.name}</span>
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {bundle.eventTypes.map((t) => (
          <span
            key={t}
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              dark ? "bg-white/8 text-white/70" : "bg-neutral-100 text-neutral-600"
            )}
          >
            {t}
          </span>
        ))}
      </div>

      <div
        className={cn(
          "mt-4 flex items-baseline justify-between border-t pt-3",
          dark ? "border-white/8" : "border-neutral-100"
        )}
      >
        <span className={cn("text-xs", dark ? "text-white/40" : "text-neutral-400")}>
          세트 예산
        </span>
        <span className={cn("text-lg font-black", dark && "text-white")}>
          {formatBudget(bundle.totalBudget[0])}
          <span className={cn("text-sm font-bold", dark ? "text-white/40" : "text-neutral-400")}>
            {" "}
            ~{" "}
          </span>
          {formatBudget(bundle.totalBudget[1])}
        </span>
      </div>
    </>
  );

  return (
    <Link href={`/artists?bundle=${bundle.id}`} className={cn("group block h-full", className)}>
      {dark ? (
        <div className="adv-card adv-card-hover h-full rounded-[1.75rem] p-5">
          {inner}
        </div>
      ) : (
        <Card className="h-full p-5 transition-colors group-hover:border-neutral-900">
          {inner}
        </Card>
      )}
    </Link>
  );
}
