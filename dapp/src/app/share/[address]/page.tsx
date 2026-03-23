import { Metadata } from "next";
import { fetchSubgraphUser } from "@/lib/subgraph";
import { redirect } from "next/navigation";

const BASE_URL = "https://focus-pet-theta.vercel.app";

// XP → pet stage (mirrors utils/pet.ts, kept separate for server-side use)
function getStage(xp: number): string {
  if (xp < 3600) return "egg";
  if (xp < 111600) return "baby";
  if (xp < 360000) return "teen";
  if (xp < 900000) return "adult";
  return "elder";
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const user = await fetchSubgraphUser(address).catch(() => null);

  const xp       = user ? Number(user.xp) : 0;
  const streak   = user ? Number(user.streak) : 0;
  const focusHrs = user ? Number(user.totalFocusTime) / 3600 : 0;
  const username = user?.username || shortAddress(address);
  const stage    = getStage(xp);

  const ogUrl = new URL(`${BASE_URL}/api/og`);
  ogUrl.searchParams.set("username", username);
  ogUrl.searchParams.set("xp", String(xp));
  ogUrl.searchParams.set("streak", String(streak));
  ogUrl.searchParams.set("stage", stage);
  ogUrl.searchParams.set("hrs", focusHrs.toFixed(1));

  const title       = `${username}'s FocusPet — ${xp.toLocaleString()} XP`;
  const description = `🔥 ${streak}-day streak · ${focusHrs.toFixed(1)} hrs focused · ${stage} stage. Can you out-focus them?`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
      type: "website",
      url: `${BASE_URL}/share/${address}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl.toString()],
    },
    // Farcaster Frame v1 — supported by all clients
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": ogUrl.toString(),
      "fc:frame:image:aspect_ratio": "1.91:1",
      "fc:frame:button:1": "🏆 View Leaderboard",
      "fc:frame:button:1:action": "link",
      "fc:frame:button:1:target": `${BASE_URL}/leaderboard`,
      "fc:frame:button:2": "🥚 Start Focusing",
      "fc:frame:button:2:action": "link",
      "fc:frame:button:2:target": BASE_URL,
    },
  };
}

/**
 * The share page itself just redirects to the main app.
 * All the value is in the Farcaster / OG metadata above.
 */
export default async function SharePage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;
  redirect(`/app?highlight=${address}`);
}
