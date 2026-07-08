import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getAgencyArtists } from "@/lib/data/artists";
import { getSessionAgency } from "@/lib/data/session";
import { profileCompleteness } from "@/lib/profile";
import { CATEGORY_LABELS, formatBudget } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Camera, Pencil } from "lucide-react";
import { NewArtistButton } from "./new-artist-button";
import { StartAgencyButton } from "../start-agency-button";

export default async function AgencyArtistsPage() {
  const agency = await getSessionAgency();
  const visible = await getAgencyArtists(agency?.id);
  const demo = !agency;
  return (
    <div>
      {demo && (
        <div className="mb-4 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          👀 <span className="font-bold">테스터 보기</span> — 샘플 데이터예요.
          소속사로 시작하면 여기부터 내 아티스트만 실제로 관리해요.
          <div>
            <StartAgencyButton />
          </div>
        </div>
      )}
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-neutral-500">
          소속 아티스트 {visible.length}팀 · 프로필과 사진은 여기서 관리해요
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* 새 아티스트 등록 */}
        <NewArtistButton />

        {visible.map((artist) => {
          const { score } = profileCompleteness(artist);
          return (
            <Card key={artist.id} className="overflow-hidden">
              <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-neutral-100 to-brand-50">
                <span className="text-4xl font-black text-neutral-300">
                  {artist.name.slice(0, 1)}
                </span>
                {!artist.imageUrl && (
                  <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-neutral-500">
                    <Camera className="h-3 w-3" /> 사진 미등록
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{artist.name}</span>
                    <Badge variant="brand">
                      {CATEGORY_LABELS[artist.category]}
                    </Badge>
                  </div>
                  <Badge
                    variant={artist.verified ? "dark" : "outline"}
                  >
                    {artist.verified ? "공개 중" : "검수 대기"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  예산대 {formatBudget(artist.budgetRange[0])}~
                  {formatBudget(artist.budgetRange[1])}
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-neutral-400">프로필 완성도</span>
                    <span
                      className={cn(
                        "font-bold",
                        score >= 80 ? "text-neutral-700" : "text-brand-600"
                      )}
                    >
                      {score}%
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-neutral-100">
                    <div
                      className="h-1.5 rounded-full bg-brand-500"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
                <Link
                  href={`/agency/artists/${artist.slug}`}
                  className="mt-4 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 text-sm font-semibold transition-colors hover:border-neutral-900"
                >
                  <Pencil className="h-3.5 w-3.5" /> 프로필 관리
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
