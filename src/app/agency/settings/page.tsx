import { getAgencyArtists } from "@/lib/data/artists";
import { getManagers } from "@/lib/data/managers";
import { getSessionAgency } from "@/lib/data/session";
import { ManagersPanel } from "./managers-panel";

export default async function AgencySettingsPage() {
  const agency = await getSessionAgency();
  const [artists, managers] = await Promise.all([
    getAgencyArtists(agency?.id),
    getManagers(),
  ]);

  return (
    <div className="space-y-10">
      <ManagersPanel initialManagers={managers} artists={artists} />
    </div>
  );
}
