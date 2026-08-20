import { notFound } from "next/navigation";
import { getOwnedArtistBySlug } from "@/lib/data/artists";
import { getSessionAgency } from "@/lib/data/session";
import { ArtistEditor } from "./artist-editor";

// [id] 세그먼트는 아티스트 slug (안정적·가독 키). DB에서 로드.
// 소유권 확인 필수 — 편집기는 견적 프리셋·분배율 같은 내부 운영값을 그대로 보여주므로
// 공개용 조회 함수를 쓰면 남의 아티스트 내부값이 노출된다.
export default async function AgencyArtistEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agency = await getSessionAgency();
  if (!agency) notFound();

  const artist = await getOwnedArtistBySlug(agency.id, id);
  if (!artist) notFound();

  return <ArtistEditor artist={artist} />;
}
