import { notFound } from "next/navigation";
import { getArtist } from "@/lib/mock-data";
import { ArtistEditor } from "./artist-editor";

export default async function AgencyArtistEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artist = getArtist(id);
  if (!artist) notFound();

  return <ArtistEditor artist={artist} />;
}
