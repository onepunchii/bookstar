import { ImageResponse } from "next/og";
import { loadPretendard } from "@/lib/og";

// 아티스트 찾기(허브) 전용 대표 OG — 프로필 OG와 같은 비주얼 언어(다크+브랜드 글로우).
export const alt = "xong 아티스트 찾기 — 연예인·인플루언서 섭외";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const font = await loadPretendard(700);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#0a0a0b",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            right: -120,
            width: 700,
            height: 700,
            borderRadius: 700,
            background:
              "radial-gradient(circle, rgba(255,90,0,0.5) 0%, rgba(255,90,0,0) 66%)",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 34, fontWeight: 700, color: "#ff5a00" }}>
            X
          </span>
          <span style={{ fontSize: 34, fontWeight: 700, color: "#ffffff" }}>
            ONG
          </span>
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 92,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "-0.03em",
            display: "flex",
          }}
        >
          아티스트 찾기
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 36,
            color: "#b5b5ba",
            display: "flex",
          }}
        >
          연예인·인플루언서 섭외 — 검증된 소속사와 직접
        </div>
        <div style={{ marginTop: 36, display: "flex", gap: 14 }}>
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
            매칭 수수료 0%
          </span>
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
            섭외가 공개
          </span>
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
