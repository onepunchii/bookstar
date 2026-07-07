import { notFound } from "next/navigation";
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
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">섭외 요청</h1>
      <p className="mt-1 text-sm text-neutral-500">
        표준 브리프로 작성하면 소속사가 더 빠르게 답변할 수 있어요
      </p>
      <BookingForm artist={artist} />
    </div>
  );
}
