import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getOwnedArtistBySlug } from "@/lib/data/artists";
import { getSessionAgency } from "@/lib/data/session";
import { getArtistBySlug as getMockArtistBySlug, ARTISTS as MOCK_ARTISTS } from "@/lib/mock-data";
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

  if (agency) {
    const artist = await getOwnedArtistBySlug(agency.id, id);
    if (!artist) notFound();
    return <ArtistEditor artist={artist} />;
  }

  // 둘러보기(데모) — 로그인 없이 콘솔을 체험하는 App Store 심사 경로.
  // 실제 아티스트를 열어주면 남의 내부 운영값이 새므로 반드시 샘플 데이터로만 보여준다.
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isDemo =
    !session?.user && cookieStore.get("xong-demo")?.value === "1";
  if (isDemo) {
    const demoArtist = getMockArtistBySlug(id) ?? MOCK_ARTISTS[0];
    if (demoArtist) return <ArtistEditor artist={demoArtist} />;
  }

  notFound();
}
