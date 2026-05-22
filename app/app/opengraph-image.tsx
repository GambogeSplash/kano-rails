import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Kano Rails — reputation-gated payment rails for African freelancers on Sui";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#0a0a0c",
          color: "#ededf0",
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 80% 15%, rgba(77,162,255,0.25), transparent 55%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 22,
            color: "#8a8894",
            fontFamily: "monospace",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: 99,
              background: "#4DA2FF",
            }}
          />
          kano rails · sui overflow 2026
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 22,
          }}
        >
          <div
            style={{
              fontSize: 96,
              lineHeight: 1.02,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <span>Your history.</span>
            <span style={{ color: "#4DA2FF" }}>Your rails.</span>
          </div>
          <div
            style={{
              fontSize: 28,
              color: "#8a8894",
              maxWidth: 880,
              lineHeight: 1.4,
            }}
          >
            Reputation-gated cross-border payments for African freelancers. On
            Sui.
          </div>

          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 14,
              alignItems: "center",
            }}
          >
            <div
              style={{
                fontSize: 20,
                color: "#22d3a3",
                fontFamily: "monospace",
                padding: "8px 14px",
                border: "1px solid rgba(34,211,163,0.35)",
                borderRadius: 8,
                background: "rgba(34,211,163,0.08)",
                display: "flex",
              }}
            >
              0.8% fee · Silver tier
            </div>
            <div
              style={{
                fontSize: 20,
                color: "#ff6b6b",
                fontFamily: "monospace",
                padding: "8px 14px",
                border: "1px solid rgba(255,107,107,0.35)",
                borderRadius: 8,
                background: "rgba(255,107,107,0.08)",
                display: "flex",
                textDecoration: "line-through",
                opacity: 0.85,
              }}
            >
              10.4% on Binance P2P
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
