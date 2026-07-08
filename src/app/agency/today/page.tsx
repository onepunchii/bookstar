import { getAgencyArtists } from "@/lib/data/artists";
import { getSessionAgency } from "@/lib/data/session";
import { getDaySchedules } from "@/lib/data/day-schedules";
import { getManagers } from "@/lib/data/managers";
import { DaySheet } from "./day-sheet";

// 서버에서 DB 데일리 시트 + 아티스트 + 매니저를 로드해 클라이언트에 전달.
export default async function AgencyTodayPage() {
  const agency = await getSessionAgency();
  const [schedules, artists, managers] = await Promise.all([
    getDaySchedules(),
    getAgencyArtists(agency?.id),
    getManagers(),
  ]);
  return (
    <DaySheet
      initialSchedules={schedules}
      artists={artists}
      managers={managers}
    />
  );
}
