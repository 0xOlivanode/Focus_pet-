import { ImageResponse } from "next/og";

export const runtime = "edge";

// Stage emoji map — keep in sync with utils/pet.ts
const STAGE_EMOJI: Record<string, string> = {
  egg: "🥚",
  baby: "🐣",
  teen: "🦖",
  adult: "🐉",
  elder: "👑",
};

// Dot-pattern background used by both card types
function DotPattern() {
  return (
    <div
      style={{
        display: "flex",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.08,
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "28px", padding: "28px" }}>
        {Array.from({ length: 48 }).map((_, i) => (
          <div
            key={i}
            style={{ width: "6px", height: "6px", backgroundColor: "#6366f1", borderRadius: "50%" }}
          />
        ))}
      </div>
    </div>
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const username = searchParams.get("username");
  const xp       = Number(searchParams.get("xp") ?? 0);
  const streak   = Number(searchParams.get("streak") ?? 0);
  const stage    = searchParams.get("stage") ?? "egg";
  const focusHrs = Number(searchParams.get("hrs") ?? 0);

  // Cache personalised cards for 1h, default card for 24h
  const maxAge = username ? 3600 : 86400;

  const cacheHeaders = { "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=3600` };

  // ─── Personalised pet card ───────────────────────────────────────────────
  if (username) {
    const petEmoji  = STAGE_EMOJI[stage] ?? "🥚";
    const stageName = stage.charAt(0).toUpperCase() + stage.slice(1);

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
          backgroundImage: "linear-gradient(135deg, #0a0a0a 0%, #1e1b4b 60%, #0f172a 100%)",
          color: "white",
          padding: "40px",
          position: "relative",
        }}
      >
        <DotPattern />

        {/* Header badge */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: "36px",
            left: "48px",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div style={{ display: "flex", fontSize: "28px", fontWeight: 900, color: "#818cf8" }}>
            FocusPet
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "11px",
              fontWeight: 700,
              color: "#10b981",
              backgroundColor: "rgba(16,185,129,0.1)",
              border: "1px solid rgba(16,185,129,0.25)",
              padding: "3px 10px",
              borderRadius: "100px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Live on Celo
          </div>
        </div>

        {/* Pet emoji */}
        <div style={{ display: "flex", fontSize: "120px", marginBottom: "16px" }}>
          {petEmoji}
        </div>

        {/* Username */}
        <div
          style={{
            display: "flex",
            fontSize: "58px",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.02em",
          }}
        >
          @{username}
        </div>

        {/* Stage label */}
        <div
          style={{
            display: "flex",
            fontSize: "22px",
            fontWeight: 600,
            color: "#818cf8",
            marginTop: "4px",
            textTransform: "uppercase",
            letterSpacing: "0.12em",
          }}
        >
          {stageName} Stage
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            marginTop: "40px",
            gap: "24px",
          }}
        >
          {[
            { label: "XP", value: xp.toLocaleString() },
            { label: "Streak", value: `🔥 ${streak}` },
            { label: "Focus", value: `${focusHrs.toFixed(1)} hrs` },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "20px",
                padding: "18px 32px",
                minWidth: "160px",
              }}
            >
              <div style={{ display: "flex", fontSize: "36px", fontWeight: 900, color: "#818cf8" }}>
                {stat.value}
              </div>
              <div style={{ display: "flex", fontSize: "14px", color: "#64748b", fontWeight: 600, marginTop: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>,
      { width: 1200, height: 630, headers: cacheHeaders },
    );
  }

  // ─── Default app card ─────────────────────────────────────────────────────
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
        position: "relative",
      }}
    >
      <DotPattern />

      <div style={{ display: "flex", fontSize: "140px", marginBottom: "30px" }}>🦖</div>

      <div style={{ display: "flex", fontSize: "110px", fontWeight: 900, color: "#818cf8", marginBottom: "10px" }}>
        FocusPet
      </div>

      <div style={{ display: "flex", fontSize: "46px", color: "#94a3b8", fontWeight: 500, textAlign: "center", maxWidth: "900px", marginTop: "10px" }}>
        Hatch, grow, and climb the leaderboard by staying focused.
      </div>

      <div
        style={{
          display: "flex",
          marginTop: "60px",
          alignItems: "center",
          gap: "24px",
          backgroundColor: "rgba(255,255,255,0.05)",
          padding: "16px 40px",
          borderRadius: "100px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ display: "flex", fontSize: "30px", fontWeight: 700, color: "#818cf8" }}>Live on Celo</div>
        <div style={{ display: "flex", fontSize: "30px", color: "rgba(255,255,255,0.2)" }}>|</div>
        <div style={{ display: "flex", fontSize: "30px", fontWeight: 700, color: "#94a3b8" }}>Earn G$</div>
      </div>
    </div>,
    { width: 1200, height: 630, headers: cacheHeaders },
  );
}
