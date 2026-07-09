import { getDocuments } from "@/lib/data/documents";
import { getSessionAgency } from "@/lib/data/session";
import { DocsLibrary } from "./docs-library";

export default async function AgencyDocsPage() {
  const agency = await getSessionAgency();
  const documents = await getDocuments(agency?.id);
  return <DocsLibrary documents={documents} />;
}
