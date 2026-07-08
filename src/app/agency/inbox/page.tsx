import { getAgencyArtists, getPublicScheduleMap } from "@/lib/data/artists";
import { getSessionAgency } from "@/lib/data/session";
import { getBookingRequests } from "@/lib/data/booking-requests";
import { getLatestQuotesMap } from "@/lib/data/quotes";
import { AgencyInbox } from "../agency-inbox";

export default async function AgencyInboxPage() {
  const agency = await getSessionAgency();
  const [requests, artists, scheduleMap, quotesMap] = await Promise.all([
    getBookingRequests(),
    getAgencyArtists(agency?.id),
    getPublicScheduleMap(),
    getLatestQuotesMap(),
  ]);
  return (
    <AgencyInbox
      initialRequests={requests}
      artists={artists}
      scheduleMap={scheduleMap}
      initialQuotes={quotesMap}
    />
  );
}
