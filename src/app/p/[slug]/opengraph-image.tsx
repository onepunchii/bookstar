import { ImageResponse } from "next/og";
import { getArtistBySlug } from "@/lib/mock-data";
import { loadPretendard } from "@/lib/og";
import { CATEGORY_LABELS, formatFollowers } from "@/lib/types";

export const alt = "xong 아티스트 섭외 프로필";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const artist = getArtistBySlug(slug);
  const font = await loadPretendard(700);

  const name = artist?.name ?? "xong";
  const tagline = artist?.tagline ?? "연예인·인플루언서 섭외";
  const category = artist ? CATEGORY_LABELS[artist.category] : "";
  const followers = artist ? formatFollowers(artist.followers) : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          gap: 60,
          padding: "80px",
          background: "#0a0a0b",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -140,
            left: 260,
            width: 700,
            height: 700,
            borderRadius: 700,
            background:
              "radial-gradient(circle, rgba(255,90,0,0.5) 0%, rgba(255,90,0,0) 66%)",
            display: "flex",
          }}
        />
        {/* 이니셜 타일 */}
        <div
          style={{
            width: 300,
            height: 380,
            borderRadius: 44,
            background: "linear-gradient(140deg, #ff5a00, #7a2a05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 200,
            fontWeight: 700,
            color: "#ffffff",
            flexShrink: 0,
          }}
        >
          {name.slice(0, 1)}
        </div>
        {/* 정보 */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 30, fontWeight: 700, color: "#ff5a00" }}>
              X
            </span>
            <span style={{ fontSize: 30, fontWeight: 700, color: "#ffffff" }}>
              ONG
            </span>
          </div>
          <div
            style={{
              marginTop: 20,
              fontSize: 96,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.03em",
              display: "flex",
            }}
          >
            {name}
          </div>
          <div
            style={{
              marginTop: 12,
              fontSize: 34,
              color: "#b5b5ba",
              maxWidth: 560,
              display: "flex",
            }}
          >
            {tagline}
          </div>
          <div style={{ marginTop: 30, display: "flex", gap: 14 }}>
            {category ? (
              <span
                style={{
                  background: "rgba(255,90,0,0.18)",
                  color: "#ffa470",
                  fontSize: 28,
                  fontWeight: 700,
                  padding: "10px 22px",
                  borderRadius: 100,
                  display: "flex",
                }}
              >
                {category}
              </span>
            ) : null}
            {followers ? (
              <span
                style={{
                  background: "rgba(255,255,255,0.08)",
                  color: "#e5e5e7",
                  fontSize: 28,
                  fontWeight: 700,
                  padding: "10px 22px",
                  borderRadius: 100,
                  display: "flex",
                }}
              >
                팔로워 {followers}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: "Pretendard", data: font, weight: 700, style: "normal" }]
        : undefined,
    }
  );
}
