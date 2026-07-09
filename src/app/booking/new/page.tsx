import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/premium/eyebrow";
import { getPublicArtistBySlug } from "@/lib/data/artists";
import { getPublicBundle } from "@/lib/data/bundles";
import { BookingForm, type SetInfo } from "./booking-form";

// 섭외 요청 폼 → 색인 제외
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string; set?: string }>;
}) {
  const { artist: slug, set: setId } = await searchParams;

  // 세트 문의: 실 번들 → 구성원 이름 + 대표(첫) 아티스트로 폼 진입
  let leadSlug = slug;
  let setInfo: SetInfo | undefined;
  if (setId) {
    const bundle = await getPublicBundle(setId);
    if (bundle && bundle.artists.length > 0) {
      leadSlug = leadSlug ?? bundle.artists[0].slug ?? undefined;
      setInfo = {
        title: bundle.title,
        members: bundle.artists.map((m) => m.name).join(" · "),
        budgetMin: bundle.budgetMin ?? 0,
      };
    }
  }

  const artist = leadSlug ? await getPublicArtistBySlug(leadSlug) : null;
  if (!artist) notFound();

  return (
    <div className="adv-dark min-h-dvh">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
        <Eyebrow>Booking Request</Eyebrow>
        <h1 className="display-kr mt-3 text-3xl font-black text-white sm:text-4xl">
          {setInfo ? "세트 섭외 문의" : "섭외 요청"}
        </h1>
        <p className="mt-2 text-sm text-white/50">
          {setInfo
            ? "세트 구성으로 문의하면 소속사가 구성·예산을 함께 검토해요"
            : "표준 브리프로 작성하면 소속사가 더 빠르게 답변할 수 있어요"}
        </p>
        <BookingForm artist={artist} setInfo={setInfo} />
      </div>
    </div>
  );
}
