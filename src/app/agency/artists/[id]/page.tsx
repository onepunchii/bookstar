import { notFound } from "next/navigation";
import { getPublicArtistBySlug } from "@/lib/data/artists";
import { ArtistEditor } from "./artist-editor";

// [id] 세그먼트는 이제 아티스트 slug (안정적·가독 키). DB에서 로드.
export default async function AgencyArtistEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const artist = await getPublicArtistBySlug(id);
  if (!artist) notFound();

  return <ArtistEditor artist={artist} />;
}
