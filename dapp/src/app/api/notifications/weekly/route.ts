import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL!;

interface SubgraphUser {
  id: string;
  username: string;
  xp: string;
  streak: string;
  totalFocusTime: string;
}

async function fetchUsersForWeeklyRecap(addresses: string[]): Promise<SubgraphUser[]> {
  if (addresses.length === 0) return [];

  const gql = `
    query WeeklyRecap($ids: [ID!]!) {
      users(where: { id_in: $ids, isActive: true }) {
        id
        username
        xp
        streak
        totalFocusTime
      }
    }
  `;

  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: gql, variables: { ids: addresses } }),
  });

  const json = await res.json();
  return json.data?.users ?? [];
}

function formatFocusTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * GET /api/notifications/weekly
 * Called by Vercel Cron every Monday at 9 AM UTC.
 * Sends a personalized weekly recap to all subscribed users.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Fetch all push subscriptions
    const { data: allSubs } = await supabase
      .from("push_subscriptions")
      .select("address, subscription");

    if (!allSubs || allSubs.length === 0) {
      return NextResponse.json({ sent: 0, message: "No subscribers" });
    }

    const addresses = allSubs.map((s) => s.address.toLowerCase());
    const users = await fetchUsersForWeeklyRecap(addresses);
    const userMap = new Map(users.map((u) => [u.id.toLowerCase(), u]));

    const expiredAddresses: string[] = [];
    let sent = 0;

    await Promise.all(
      allSubs.map(async ({ address, subscription }) => {
        const user = userMap.get(address.toLowerCase());

        const focusSecs = user ? parseInt(user.totalFocusTime) : 0;
        const streak = user ? parseInt(user.streak) : 0;
        const xp = user ? parseInt(user.xp) : 0;
        const name = user?.username ? `@${user.username}` : "Focuser";

        const body = user
          ? `${name} — ${formatFocusTime(focusSecs)} focused, ${streak} day streak, ${xp.toLocaleString()} XP. Keep it up! 🚀`
          : "It's a new week — hatch your pet and start climbing the leaderboard! 🥚";

        try {
          await webpush.sendNotification(
            subscription as webpush.PushSubscription,
            JSON.stringify({
              title: "📅 Your Weekly Focus Recap",
              body,
              url: "/history",
              tag: "weekly-recap",
            }),
          );
          sent++;
        } catch (err: any) {
          if (err?.statusCode === 410) expiredAddresses.push(address);
        }
      }),
    );

    // Clean up expired subscriptions
    if (expiredAddresses.length > 0) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .in("address", expiredAddresses);
    }

    return NextResponse.json({ sent, expired: expiredAddresses.length });
  } catch (err) {
    console.error("Weekly recap cron error:", err);
    return NextResponse.json({ error: "Weekly cron failed" }, { status: 500 });
  }
}
