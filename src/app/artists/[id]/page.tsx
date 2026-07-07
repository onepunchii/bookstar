import Link from "next/link";
import { notFound } from "next/navigation";
import { AvailabilityCalendar } from "@/components/availability-calendar";
import { MomentumCard } from "@/components/momentum-card";
import { RatingStars } from "@/components/rating-stars";
import { ReviewsSection } from "@/components/reviews-section";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getArtist, getRatingSummary, SCHEDULES } from "@/lib/mock-data";
import {
  CATEGORY_LABELS,
  formatBudget,
  formatFollowers,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import { BadgeCheck, Clock, TrendingUp, Users } from "lucide-react";

export default async function ArtistDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artist = getArtist(id);
  if (!artist) notFound();
  const schedule = SCHEDULES[artist.id] ?? [];
  const rating = getRatingSummary(artist.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Left: profile */}
        <div className="lg:col-span-2">
          <div className="flex items-start gap-5">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-neutral-100 to-brand-50 text-4xl font-black text-neutral-300">
              {artist.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight">
                  {artist.name}
                </h1>
                {artist.verified && (
                  <BadgeCheck className="h-5 w-5 text-brand-500" />
                )}
              </div>
              <p className="mt-0.5 text-sm text-neutral-500">
                {artist.agencyName}
              </p>
              {rating.count > 0 && (
                <div className="mt-1 flex items-center gap-2">
                  <RatingStars value={rating.avg} size="sm" />
                  <span className="text-sm font-bold">
                    {rating.avg.toFixed(1)}
                  </span>
                  <span className="text-xs text-neutral-400">
                    ({rating.count}건)
                  </span>
                </div>
              )}
              <p className="mt-2 text-neutral-700">{artist.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {artist.categories.map((c) => (
                  <Badge key={c} variant="brand">
                    {CATEGORY_LABELS[c]}
                  </Badge>
                ))}
                {artist.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              {
                icon: Users,
                label: "팔로워",
                value: formatFollowers(artist.followers),
              },
              {
                icon: TrendingUp,
                label: "응답률",
                value: `${artist.responseRate}%`,
              },
              {
                icon: Clock,
                label: "평균 응답",
                value: `${artist.responseHours}시간`,
              },
            ].map((stat) => (
              <Card key={stat.label} className="p-4">
                <stat.icon className="h-4 w-4 text-brand-500" />
                <p className="mt-2 text-lg font-bold">{stat.value}</p>
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </Card>
            ))}
          </div>

          {/* Momentum */}
          <section className="mt-10">
            <MomentumCard artistId={artist.id} />
          </section>

          {/* Recent work */}
          <section className="mt-10">
            <h2 className="text-lg font-bold">최근 활동</h2>
            <ul className="mt-3 space-y-2">
              {artist.recentWork.map((work) => (
                <li
                  key={work}
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 px-4 py-3 text-sm"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  {work}
                </li>
              ))}
            </ul>
          </section>

          {/* Reviews */}
          <section className="mt-10">
            <ReviewsSection artistId={artist.id} />
          </section>

          {/* Calendar */}
          <section className="mt-10">
            <Card className="p-6">
              <AvailabilityCalendar
                days={schedule}
                monthLabel="2026년 7월"
                firstDayOffset={3}
              />
            </Card>
          </section>
        </div>

        {/* Right: booking box */}
        <div>
          <Card className="sticky top-24 p-6">
            <p className="text-sm text-neutral-500">예상 섭외 비용</p>
            <p className="mt-1 text-2xl font-black">
              {formatBudget(artist.budgetRange[0])} ~{" "}
              {formatBudget(artist.budgetRange[1])}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              행사 유형과 조건에 따라 달라질 수 있어요
            </p>
            <Link
              href={`/booking/new?artist=${artist.id}`}
              className={cn(buttonVariants({ size: "lg" }), "mt-5 w-full")}
            >
              섭외 요청하기
            </Link>
            <div className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm">
              <p className="font-semibold">
                평균 {artist.responseHours}시간 내 응답
              </p>
              <p className="mt-1 text-neutral-500">
                {artist.agencyName} 담당자가 요청을 검토한 후 수락·협의·거절로
                답변드려요.
              </p>
            </div>
            <p className="mt-4 text-xs text-neutral-400">
              요청은 무료이며, 견적 확정 전까지 비용이 발생하지 않습니다.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
