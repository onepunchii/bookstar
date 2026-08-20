import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/lib/db";
import { getSessionAgency } from "@/lib/data/session";
import { agencyArtistIdBySlug } from "@/lib/data/ownership";

// 소속사 아티스트 삭제 — 소유권 확인 후 참조 데이터까지 정리.
// 안전장치: 섭외 요청(광고주가 보낸 문의)이 있으면 하드 삭제를 막고 "비공개 전환"을 권한다.
// (요청을 지우면 광고주의 실제 문의 기록이 사라지므로.)
interface Payload {
  slug: string;
  /** 요청 이력이 있어도 공개만 내리는 소프트 삭제(status='archived') */
  archive?: boolean;
}

export async function POST(req: Request) {
  try {
    const agency = await getSessionAgency();
    if (!agency) {
      return NextResponse.json(
        { error: "소속사 인증이 필요합니다" },
        { status: 401 }
      );
    }

    const body = (await req.json()) as Payload;
    if (!body.slug) {
      return NextResponse.json({ error: "slug 누락" }, { status: 400 });
    }

    // IDOR 방어 — 이 slug가 세션 소속사 소유인지
    const artistId = await agencyArtistIdBySlug(agency.id, body.slug);
    if (!artistId) {
      return NextResponse.json(
        { error: "해당 아티스트를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const db = getDb();

    // 섭외 요청 존재 여부 — 광고주 문의 기록 보호
    const reqRows = await db
      .select({ id: schema.bookingRequests.id })
      .from(schema.bookingRequests)
      .where(eq(schema.bookingRequests.artistId, artistId));

    // 비공개 전환(소프트) — 요청 이력을 보존한 채 공개 노출만 중단
    if (body.archive) {
      await db
        .update(schema.artists)
        .set({ status: "archived" })
        .where(eq(schema.artists.id, artistId));
      revalidatePath("/agency/artists");
      revalidatePath("/artists");
      revalidatePath(`/p/${body.slug}`);
      return NextResponse.json({ ok: true, mode: "archived" });
    }

    if (reqRows.length > 0) {
      // 하드 삭제 거부 — 광고주 문의가 함께 지워지는 것을 막는다
      return NextResponse.json(
        {
          error: "섭외 요청 이력이 있어 삭제할 수 없습니다",
          requestCount: reqRows.length,
          canArchive: true,
        },
        { status: 409 }
      );
    }

    // 요청 이력이 없으면 참조 데이터 정리 후 삭제 (자식 → 부모)
    await db
      .delete(schema.schedules)
      .where(eq(schema.schedules.artistId, artistId));
    await db
      .delete(schema.daySchedules)
      .where(eq(schema.daySchedules.artistId, artistId));
    await db.delete(schema.holds).where(eq(schema.holds.artistId, artistId));
    await db.delete(schema.leaves).where(eq(schema.leaves.artistId, artistId));
    await db
      .delete(schema.settlements)
      .where(eq(schema.settlements.artistId, artistId));
    await db
      .delete(schema.campaignApplications)
      .where(eq(schema.campaignApplications.artistId, artistId));
    await db
      .delete(schema.documents)
      .where(eq(schema.documents.artistId, artistId));

    // 라인업 번들의 artist_ids(jsonb 배열)에서 제거 — 깨진 참조 방지
    const agencyBundles = await db
      .select({ id: schema.bundles.id, artistIds: schema.bundles.artistIds })
      .from(schema.bundles)
      .where(eq(schema.bundles.agencyId, agency.id));
    for (const b of agencyBundles) {
      if (!b.artistIds?.includes(artistId)) continue;
      await db
        .update(schema.bundles)
        .set({ artistIds: b.artistIds.filter((id) => id !== artistId) })
        .where(eq(schema.bundles.id, b.id));
    }

    await db.delete(schema.artists).where(eq(schema.artists.id, artistId));

    revalidatePath("/agency/artists");
    revalidatePath("/artists");
    revalidatePath(`/p/${body.slug}`);
    return NextResponse.json({ ok: true, mode: "deleted" });
  } catch (e) {
    console.error("[artists/delete]", e);
    return NextResponse.json(
      { error: "삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
