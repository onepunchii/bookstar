import { ImageResponse } from "next/og";
import { loadPretendard } from "@/lib/og";

export const alt = "xong · 연예인·인플루언서 섭외";
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
        {/* 오렌지 글로우 */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 620,
            height: 620,
            borderRadius: 620,
            background:
              "radial-gradient(circle, rgba(255,90,0,0.55) 0%, rgba(255,90,0,0) 68%)",
            display: "flex",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontSize: 40, fontWeight: 700, color: "#ff5a00" }}>
            X
          </span>
          <span style={{ fontSize: 40, fontWeight: 700, color: "#ffffff" }}>
            ONG
          </span>
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 78,
            fontWeight: 700,
            color: "#ffffff",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <span>연예인·인플루언서 섭외,</span>
          <span style={{ color: "#8a8a8f" }}>가장 빠른 연결</span>
        </div>
        <div
          style={{
            marginTop: 44,
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <span
            style={{
              background: "#ff5a00",
              color: "#fff",
              fontSize: 30,
              fontWeight: 700,
              padding: "12px 26px",
              borderRadius: 100,
              display: "flex",
            }}
          >
            매칭 수수료 0%
          </span>
          <span style={{ color: "#b5b5ba", fontSize: 30, display: "flex" }}>
            B2B 부킹 OS · eXperience ON
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
