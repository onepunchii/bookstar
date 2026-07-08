import { getAgencyArtists, getPublicScheduleMap } from "@/lib/data/artists";
import { getHolds } from "@/lib/data/holds";
import { getLeaves } from "@/lib/data/leaves";
import { ScheduleManager } from "./schedule-manager";

// 서버에서 DB 아티스트·일정·홀드·휴가를 로드해 클라이언트 매니저에 전달.
export default async function AgencySchedulePage() {
  const [artists, schedulesByArtist, holds, leaves] = await Promise.all([
    getAgencyArtists(),
    getPublicScheduleMap(),
    getHolds(),
    getLeaves(),
  ]);
  return (
    <ScheduleManager
      artists={artists}
      schedulesByArtist={schedulesByArtist}
      initialHolds={holds}
      initialLeaves={leaves}
    />
  );
}
