import { getPublicArtistBySlug } from "@/lib/data/artists";
import { getDaySchedulesByArtist } from "@/lib/data/day-schedules";
import { MySchedule } from "./my-schedule";

// 데모 아티스트(정하늘=haneul) 기준. 실 인증 연동 시 세션 아티스트로 교체.
export default async function MePage() {
  const artist = await getPublicArtistBySlug("haneul");
  const schedules = artist ? await getDaySchedulesByArtist(artist.id) : [];
  return (
    <MySchedule
      schedules={schedules}
      artistName={artist?.name ?? "정하늘"}
    />
  );
}
