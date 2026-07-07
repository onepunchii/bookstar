import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getArtist } from "@/lib/mock-data";
import { formatBudget, type LineupBundle } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowRight, Package } from "lucide-react";

interface Props {
  bundle: LineupBundle;
  className?: string;
}

export function LineupBundleCard({ bundle, className }: Props) {
  const artists = bundle.artistIds
    .map((id) => getArtist(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof getArtist>>[];

  return (
    <Link href={`/artists?bundle=${bundle.id}`} className={cn("group", className)}>
      <Card className="h-full p-5 transition-colors group-hover:border-neutral-900">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-brand-500" />
              <span className="text-xs font-bold text-brand-600">
                {artists.length}인 세트
              </span>
              {bundle.discountPct && (
                <Badge variant="solid">-{bundle.discountPct}%</Badge>
              )}
            </div>
            <h3 className="mt-1 text-base font-black">{bundle.title}</h3>
            <p className="mt-0.5 text-xs text-neutral-500">{bundle.subtitle}</p>
          </div>
          <ArrowRight className="h-4 w-4 shrink-0 text-neutral-300 transition-colors group-hover:text-neutral-900" />
        </div>

        {/* 아티스트 썸네일 스택 */}
        <div className="mt-4 flex -space-x-2">
          {artists.map((a) => (
            <div
              key={a.id}
              title={a.name}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-neutral-100 to-brand-50 text-sm font-black text-neutral-400 ring-2 ring-white"
            >
              {a.name.slice(0, 1)}
            </div>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-neutral-600">
          {artists.map((a, i) => (
            <span key={a.id} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-neutral-300">·</span>}
              <span className="font-semibold">{a.name}</span>
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {bundle.eventTypes.map((t) => (
            <Badge key={t}>{t}</Badge>
          ))}
        </div>

        <div className="mt-4 flex items-baseline justify-between border-t border-neutral-100 pt-3">
          <span className="text-xs text-neutral-400">세트 예산</span>
          <span className="text-lg font-black">
            {formatBudget(bundle.totalBudget[0])}
            <span className="text-sm font-bold text-neutral-400"> ~ </span>
            {formatBudget(bundle.totalBudget[1])}
          </span>
        </div>
      </Card>
    </Link>
  );
}
