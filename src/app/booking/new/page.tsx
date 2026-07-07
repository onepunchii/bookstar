import { notFound } from "next/navigation";
import { Eyebrow } from "@/components/premium/eyebrow";
import { getArtist } from "@/lib/mock-data";
import { BookingForm } from "./booking-form";

export default async function NewBookingPage({
  searchParams,
}: {
  searchParams: Promise<{ artist?: string }>;
}) {
  const { artist: artistId } = await searchParams;
  const artist = artistId ? getArtist(artistId) : undefined;
  if (!artist) notFound();

  return (
    <div className="adv-dark min-h-dvh">
      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8 sm:py-16">
        <Eyebrow>Booking Request</Eyebrow>
        <h1 className="display-kr mt-3 text-3xl font-black text-white sm:text-4xl">
          섭외 요청
        </h1>
        <p className="mt-2 text-sm text-white/50">
          표준 브리프로 작성하면 소속사가 더 빠르게 답변할 수 있어요
        </p>
        <BookingForm artist={artist} />
      </div>
    </div>
  );
}
