import { getPublicArtistBySlug } from "@/lib/data/artists";
import { getLeaves } from "@/lib/data/leaves";
import { LeaveForm } from "./leave-form";

export default async function MyLeavePage() {
  const artist = await getPublicArtistBySlug("haneul");
  const all = await getLeaves();
  const mine = artist ? all.filter((l) => l.artistId === artist.id) : [];
  return (
    <LeaveForm
      artistId={artist?.id ?? ""}
      artistName={artist?.name ?? "정하늘"}
      initialRequests={mine}
    />
  );
}
