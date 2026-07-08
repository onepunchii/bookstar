import { getDocuments } from "@/lib/data/documents";
import { DocsLibrary } from "./docs-library";

export default async function AgencyDocsPage() {
  const documents = await getDocuments();
  return <DocsLibrary documents={documents} />;
}
