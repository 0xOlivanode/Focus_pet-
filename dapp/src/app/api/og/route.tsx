import { ImageResponse } from "next/og";
// App router includes @vercel/og.
// No need to install it.

export const runtime = "edge";

export async function GET(request: Request) {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0a0a0a",
        backgroundImage:
          "radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0a0a0a 100%)",
        color: "white",
        fontFamily: "Inter, sans-serif",
        padding: "40px",
      }}
    >
      {/* Decorative Grid */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "radial-gradient(#4f46e5 0.5px, transparent 0.5px)",
          backgroundSize: "24px 24px",
          opacity: 0.1,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            fontSize: "120px",
            filter: "drop-shadow(0 0 20px rgba(99, 102, 241, 0.4))",
          }}
        >
          🦖
        </div>
      </div>

      <h1
        style={{
          fontSize: "100px",
          fontWeight: 900,
          margin: 0,
          letterSpacing: "-0.05em",
          background: "linear-gradient(to right, #818cf8, #c084fc)",
          backgroundClip: "text",
          color: "transparent",
          textAlign: "center",
        }}
      >
        FocusPet
      </h1>

      <p
        style={{
          fontSize: "42px",
          color: "#94a3b8",
          marginTop: "20px",
          fontWeight: 500,
          textAlign: "center",
          maxWidth: "800px",
        }}
      >
        Hatch, grow, and climb the leaderboard by staying focused.
      </p>

      <div
        style={{
          display: "flex",
          marginTop: "60px",
          alignItems: "center",
          gap: "12px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          padding: "12px 24px",
          borderRadius: "100px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <span style={{ fontSize: "24px", fontWeight: 700, color: "#818cf8" }}>
          Live on Celo
        </span>
        <span style={{ fontSize: "24px", color: "rgba(255,255,255,0.3)" }}>
          •
        </span>
        <span style={{ fontSize: "24px", fontWeight: 700, color: "#94a3b8" }}>
          Earn G$
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
