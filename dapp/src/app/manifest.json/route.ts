import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? "";
  const isAppSubdomain = host.startsWith("app.");

  const manifest = {
    name: "FocusPet",
    short_name: "FocusPet",
    description: "Hatch dinosaurs, earn G$, and climb the leaderboard by staying focused.",
    start_url: isAppSubdomain ? "/" : "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#6366f1",
    background_color: "#0a0a0b",
    icons: [
      { src: "/focus-pet.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/focus-pet.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
    categories: ["productivity", "games"],
    screenshots: [
      { src: "/api/og", sizes: "1200x630", type: "image/png" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
