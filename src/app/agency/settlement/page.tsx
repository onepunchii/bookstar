import { getAgencyArtists } from "@/lib/data/artists";
import { getSettlements } from "@/lib/data/settlements";
import { SettlementBoard } from "./settlement-board";

export default async function AgencySettlementPage() {
  const [settlements, artists] = await Promise.all([
    getSettlements(),
    getAgencyArtists(),
  ]);
  return <SettlementBoard initialSettlements={settlements} artists={artists} />;
}
