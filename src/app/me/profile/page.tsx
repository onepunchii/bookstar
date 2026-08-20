import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ArtistEditor } from "@/app/agency/artists/[id]/artist-editor";
import { getPublicArtistById } from "@/lib/data/artists";
import {
  getSessionAgency,
  getSessionArtistId,
  getSessionUser,
} from "@/lib/data/session";
import { agencyArtistIdBySlug } from "@/lib/data/ownership";
import { ARTISTS as MOCK_ARTISTS } from "@/lib/mock-data";

// 크리에이터 셀프 프로필 편집.
// 지금까지 프로필 편집은 소속사 콘솔에만 있어서, 온보딩으로 프로필을 만든 크리에이터가
// 이후에 고칠 방법이 사실상 없었다("내 홈페이지"가 되려면 본인이 관리할 수 있어야 한다).
//
// 권한: 본인 계정에 연결된 아티스트만. 단가·분배율 같은 운영값은 소속사가 정하므로
// 편집기에서 숨기고(scope="creator"), 서버(update API)에서도 해당 필드를 잘라낸다.
export default async function MyProfilePage() {
  const [artistId, user, cookieStore] = await Promise.all([
    getSessionArtistId(),
    getSessionUser(),
    cookies(),
  ]);

  if (artistId) {
    const artist = await getPublicArtistById(artistId);
    if (!artist) notFound();
    // 1인 기획사는 본인 소속사를 소유하므로 예산·운영값까지 편집할 수 있어야 한다.
    // 남의 소속사 전속 아티스트만 운영값을 제외한다.
    const agency = await getSessionAgency();
    const ownsAgency =
      agency !== null && Boolean(await agencyArtistIdBySlug(agency.id, artist.slug));
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <ArtistEditor artist={artist} scope={ownsAgency ? "agency" : "creator"} />
      </div>
    );
  }

  // 둘러보기(데모) — 샘플 아티스트로 화면만 체험
  const isDemo = !user && cookieStore.get("xong-demo")?.value === "1";
  if (isDemo && MOCK_ARTISTS[0]) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <ArtistEditor artist={MOCK_ARTISTS[0]} scope="creator" />
      </div>
    );
  }

  notFound();
}
