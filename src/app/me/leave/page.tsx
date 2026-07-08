import { getPublicArtistById, getPublicArtistBySlug } from "@/lib/data/artists";
import { getSessionArtistId } from "@/lib/data/session";
import { getLeaves } from "@/lib/data/leaves";
import { LeaveForm } from "./leave-form";

export default async function MyLeavePage() {
  const sessionArtistId = await getSessionArtistId();
  const artist = sessionArtistId
    ? await getPublicArtistById(sessionArtistId)
    : await getPublicArtistBySlug("haneul"); // 미가입=데모(정하늘)
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
