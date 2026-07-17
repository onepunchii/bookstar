import { signOut } from "@/auth";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { getPublicArtistById, getPublicArtistBySlug } from "@/lib/data/artists";
import { getSessionArtistId, getSessionUser } from "@/lib/data/session";
import { getDaySchedulesByArtist } from "@/lib/data/day-schedules";
import { getLeaves } from "@/lib/data/leaves";
import { LogOut } from "lucide-react";
import { MySchedule } from "./my-schedule";

// 데모 아티스트(정하늘=haneul) 기준. 실 인증 연동 시 세션 아티스트로 교체.
export default async function MePage() {
  const [sessionArtistId, user] = await Promise.all([
    getSessionArtistId(),
    getSessionUser(),
  ]);
  const artist = sessionArtistId
    ? await getPublicArtistById(sessionArtistId)
    : await getPublicArtistBySlug("haneul"); // 미가입=데모(정하늘)
  const [schedules, allLeaves] = await Promise.all([
    artist ? getDaySchedulesByArtist(artist.id) : Promise.resolve([]),
    getLeaves(),
  ]);
  const myLeaves = artist
    ? allLeaves.filter((l) => l.artistId === artist.id)
    : [];
  return (
    <>
      <MySchedule
        schedules={schedules}
        artistName={artist?.name ?? "정하늘"}
        leaves={myLeaves}
      />
      {user && (
        <div className="mx-auto max-w-2xl px-4 pb-10 sm:px-6">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
            className="mt-2"
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-500 transition-colors hover:text-neutral-900"
            >
              <LogOut className="h-4 w-4" /> 로그아웃
            </button>
          </form>
          <DeleteAccountButton />
        </div>
      )}
    </>
  );
}
