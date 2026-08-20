import { notFound } from "next/navigation";
import QRCode from "qrcode";
import type { Metadata } from "next";
import { getPublicArtistBySlug } from "@/lib/data/artists";
import { getT } from "@/lib/i18n/server";
import { resolveArtistName } from "@/lib/profile";
import {
  buildSpecRows,
  redactArtist,
  specExtraRows,
} from "@/lib/profile-fields";
import { artistPublicUrl } from "@/lib/site";
import { CATEGORY_LABELS, formatBudget } from "@/lib/types";
import { PrintButton } from "./print-button";

// 프로필 자료(미디어킷) — 인쇄해서 제출하거나 PDF로 저장하는 한 장짜리 문서.
// 국내 캐스팅 실무는 여전히 프로필북 한 장과 인쇄 컴카드로 돌아가고, 1인 기획사는
// 이걸 만들 도구가 없다. 여기서 자동 생성하고 하단에 프로필 URL + QR을 박아
// 오프라인 제출물이 다시 온라인 유입으로 돌아오게 한다.
//
// PDF 생성에 puppeteer를 쓰지 않는 이유: 서버리스에서 무겁고 콜드스타트가 길다.
// 브라우저 인쇄(Save as PDF)가 폰트·페이지 크기를 더 정확히 처리하고 iOS에서도 된다.

export const metadata: Metadata = {
  robots: { index: false, follow: false }, // 인쇄용 문서 — 본 프로필과 중복 색인 방지
};

export default async function ArtistKitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raw = await getPublicArtistBySlug(slug);
  if (!raw) notFound();

  // 배포용 문서이므로 항상 게스트 기준으로 리댁션 — 비공개 값이 인쇄물에 실리면 안 된다.
  const artist = redactArtist(raw, "guest");
  const { t, locale } = await getT({ botDefault: "ko" });
  const name = resolveArtistName(artist, locale);
  const url = artistPublicUrl(slug);

  const specRows = [...buildSpecRows(artist, "guest", t), ...specExtraRows(artist)];
  const photos = [artist.imageUrl, ...(artist.galleryUrls ?? [])].filter(
    Boolean
  ) as string[];
  const credits = [...(artist.credits ?? [])]
    .sort((a, b) => {
      if (!!a.highlighted !== !!b.highlighted) return a.highlighted ? -1 : 1;
      return (b.year ?? 0) - (a.year ?? 0);
    })
    .slice(0, 12);
  const [budgetMin, budgetMax] = artist.budgetRange;

  const qrSvg = await QRCode.toString(url, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#ffffff" },
  });

  return (
    <div className="kit-root min-h-dvh bg-neutral-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between px-4 print:hidden">
        <p className="text-sm text-neutral-500">{t("kit.hint")}</p>
        <PrintButton label={t("kit.saveCta")} />
      </div>

      {/* A4 한 장 — 인쇄 시 여백은 @page가 잡는다 */}
      <article className="mx-auto w-full max-w-[210mm] bg-white p-[14mm] text-neutral-900 shadow-sm print:max-w-none print:p-0 print:shadow-none">
        {/* 헤더 */}
        <header className="flex items-end justify-between gap-6 border-b-2 border-neutral-900 pb-4">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-neutral-400">
              {CATEGORY_LABELS[artist.category]}
              {artist.agencyName ? ` · ${artist.agencyName}` : ""}
            </p>
            <h1 className="mt-1 text-4xl font-black leading-none tracking-tight">
              {name}
            </h1>
            {artist.tagline && (
              <p className="mt-2 text-sm text-neutral-600">{artist.tagline}</p>
            )}
          </div>
          {budgetMin > 0 && (
            <div className="shrink-0 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {t("kit.budget")}
              </p>
              <p className="text-sm font-bold tabular-nums">
                {formatBudget(budgetMin, locale)}~{formatBudget(budgetMax, locale)}
              </p>
            </div>
          )}
        </header>

        {/* 사진 — 대표 크게, 나머지 그리드 */}
        {photos.length > 0 && (
          <div className="mt-5 grid grid-cols-4 gap-2">
            {photos.slice(0, 5).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt=""
                className={
                  i === 0
                    ? "col-span-2 row-span-2 aspect-[3/4] w-full rounded-md object-cover"
                    : "aspect-[3/4] w-full rounded-md object-cover"
                }
              />
            ))}
          </div>
        )}

        {/* 스펙 — 2열 라벨:값 */}
        {specRows.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              {t("profile.spec.heading")}
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {specRows
                .filter((r) => !r.locked)
                .map((r) => (
                  <div
                    key={r.key}
                    className={`flex gap-3 border-b border-neutral-100 py-1 ${
                      r.wide ? "col-span-2" : ""
                    }`}
                  >
                    <dt className="w-24 shrink-0 text-xs font-semibold text-neutral-400">
                      {r.label}
                    </dt>
                    <dd className="min-w-0 flex-1 text-[13px] tabular-nums">
                      {r.value}
                    </dd>
                  </div>
                ))}
            </dl>
          </section>
        )}

        {/* 활동 이력 */}
        {credits.length > 0 && (
          <section className="mt-5">
            <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              {t("profile.credits.heading")}
            </h2>
            <ul className="grid grid-cols-2 gap-x-6">
              {credits.map((c, i) => (
                <li
                  key={i}
                  className="flex items-baseline gap-2 border-b border-neutral-100 py-1 text-[13px]"
                >
                  <span className="w-9 shrink-0 tabular-nums text-neutral-400">
                    {c.year ?? ""}
                  </span>
                  <span className="min-w-0 flex-1">
                    {c.type && (
                      <span className="mr-1.5 text-[10px] font-bold text-neutral-400">
                        {c.type}
                      </span>
                    )}
                    {c.title}
                    {c.role && (
                      <span className="ml-1 text-neutral-500">{c.role}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 소개 */}
        {artist.bio && (
          <section className="mt-5">
            <h2 className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-400">
              {t("profile.about.heading")}
            </h2>
            <p
              className="whitespace-pre-line text-[13px] leading-relaxed text-neutral-700"
              style={{ wordBreak: "keep-all" }}
            >
              {artist.bio}
            </p>
          </section>
        )}

        {/* 푸터 — QR + URL. 이게 오프라인 제출물을 온라인 유입으로 되돌리는 고리다 */}
        <footer className="mt-6 flex items-center gap-4 border-t-2 border-neutral-900 pt-4">
          <div
            className="h-[22mm] w-[22mm] shrink-0 [&>svg]:h-full [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              {t("kit.scanLabel")}
            </p>
            <p className="break-all text-sm font-bold">{url}</p>
            <p className="mt-1 text-[11px] text-neutral-400">{t("kit.footer")}</p>
          </div>
        </footer>
      </article>
    </div>
  );
}
