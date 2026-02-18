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
        backgroundImage: "linear-gradient(to bottom right, #0a0a0a, #1e1b4b)",
        color: "white",
        padding: "40px",
      }}
    >
      {/* Pattern Replacement */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
        }}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "30px",
            padding: "30px",
          }}
        >
          {Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: "6px",
                height: "6px",
                backgroundColor: "#6366f1",
                borderRadius: "50%",
              }}
            />
          ))}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          fontSize: "140px",
          marginBottom: "30px",
        }}
      >
        🦖
      </div>

      <div
        style={{
          display: "flex",
          fontSize: "110px",
          fontWeight: 900,
          color: "#818cf8",
          marginBottom: "10px",
        }}
      >
        FocusPet
      </div>

      <div
        style={{
          display: "flex",
          fontSize: "46px",
          color: "#94a3b8",
          fontWeight: 500,
          textAlign: "center",
          maxWidth: "900px",
          marginTop: "10px",
        }}
      >
        Hatch, grow, and climb the leaderboard by staying focused.
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "60px",
          alignItems: "center",
          gap: "24px",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          padding: "16px 40px",
          borderRadius: "100px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: "30px",
            fontWeight: 700,
            color: "#818cf8",
          }}
        >
          Live on Celo
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "30px",
            color: "rgba(255,255,255,0.2)",
          }}
        >
          |
        </div>
        <div
          style={{
            display: "flex",
            fontSize: "30px",
            fontWeight: 700,
            color: "#94a3b8",
          }}
        >
          Earn G$
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}
