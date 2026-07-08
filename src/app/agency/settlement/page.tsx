import { getAgencyArtists } from "@/lib/data/artists";
import { getSessionAgency } from "@/lib/data/session";
import { getSettlements } from "@/lib/data/settlements";
import { SettlementBoard } from "./settlement-board";

export default async function AgencySettlementPage() {
  const agency = await getSessionAgency();
  const [settlements, artists] = await Promise.all([
    getSettlements(agency?.id),
    getAgencyArtists(agency?.id),
  ]);
  return <SettlementBoard initialSettlements={settlements} artists={artists} />;
}
