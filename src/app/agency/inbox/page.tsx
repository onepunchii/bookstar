import { getAgencyArtists, getPublicScheduleMap } from "@/lib/data/artists";
import { getSessionAgency } from "@/lib/data/session";
import { getBookingRequests } from "@/lib/data/booking-requests";
import { AgencyInbox } from "../agency-inbox";

export default async function AgencyInboxPage() {
  const agency = await getSessionAgency();
  const [requests, artists, scheduleMap] = await Promise.all([
    getBookingRequests(),
    getAgencyArtists(agency?.id),
    getPublicScheduleMap(),
  ]);
  return (
    <AgencyInbox
      initialRequests={requests}
      artists={artists}
      scheduleMap={scheduleMap}
    />
  );
}
