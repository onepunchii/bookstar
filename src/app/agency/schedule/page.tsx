import { getAgencyArtists, getPublicScheduleMap } from "@/lib/data/artists";
import { ScheduleManager } from "./schedule-manager";

// 서버에서 DB 아티스트 + 일정 맵(uuid 키)을 로드해 클라이언트 매니저에 전달.
export default async function AgencySchedulePage() {
  const [artists, schedulesByArtist] = await Promise.all([
    getAgencyArtists(),
    getPublicScheduleMap(),
  ]);
  return (
    <ScheduleManager
      artists={artists}
      schedulesByArtist={schedulesByArtist}
    />
  );
}
