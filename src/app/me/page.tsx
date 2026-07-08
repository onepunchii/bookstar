import { getPublicArtistById, getPublicArtistBySlug } from "@/lib/data/artists";
import { getSessionArtistId } from "@/lib/data/session";
import { getDaySchedulesByArtist } from "@/lib/data/day-schedules";
import { getLeaves } from "@/lib/data/leaves";
import { MySchedule } from "./my-schedule";

// 데모 아티스트(정하늘=haneul) 기준. 실 인증 연동 시 세션 아티스트로 교체.
export default async function MePage() {
  const sessionArtistId = await getSessionArtistId();
  const artist = sessionArtistId
    ? await getPublicArtistById(sessionArtistId)
    : await getPublicArtistBySlug("haneul"); // 미가입=데모(정하늘)
  const [schedules, allLeaves] = await Promise.all([
    artist ? getDaySchedulesByArtist(artist.id) : Promise.resolve([]),
    getLeaves(),
  ]);
  const myLeaves = artist
    ? allLeaves.filter((l) => l.artistId === artist.id)
    : [];
  return (
    <MySchedule
      schedules={schedules}
      artistName={artist?.name ?? "정하늘"}
      leaves={myLeaves}
    />
  );
}
