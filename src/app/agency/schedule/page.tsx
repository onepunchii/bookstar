import { getAgencyArtists, getPublicScheduleMap } from "@/lib/data/artists";
import { getSessionAgency } from "@/lib/data/session";
import { getHolds } from "@/lib/data/holds";
import { getLeaves } from "@/lib/data/leaves";
import { signCalendarToken } from "@/lib/calendar-token";
import { ScheduleManager } from "./schedule-manager";

// 서버에서 DB 아티스트·일정·홀드·휴가를 로드해 클라이언트 매니저에 전달.
export default async function AgencySchedulePage() {
  const agency = await getSessionAgency();
  const [artists, schedulesByArtist, holds, leaves] = await Promise.all([
    getAgencyArtists(agency?.id),
    getPublicScheduleMap(),
    getHolds(agency?.id),
    getLeaves(agency?.id),
  ]);
  // 캘린더 구독 토큰 — 서버에서 서명해 클라이언트에 전달(내 아티스트만)
  const feedTokens = Object.fromEntries(
    artists.map((a) => [a.id, signCalendarToken(a.id)])
  );
  return (
    <ScheduleManager
      artists={artists}
      schedulesByArtist={schedulesByArtist}
      initialHolds={holds}
      initialLeaves={leaves}
      feedTokens={feedTokens}
    />
  );
}
