import { getAgencyArtists, getPublicScheduleMap } from "@/lib/data/artists";
import { getBookingRequests } from "@/lib/data/booking-requests";
import { AgencyInbox } from "../agency-inbox";

export default async function AgencyInboxPage() {
  const [requests, artists, scheduleMap] = await Promise.all([
    getBookingRequests(),
    getAgencyArtists(),
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
