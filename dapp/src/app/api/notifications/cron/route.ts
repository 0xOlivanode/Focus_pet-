import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

function initWebPush() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL!;

/**
 * Fetches users whose streak is active but haven't interacted in 20-23 hours
 * (i.e. their streak is at risk of breaking in the next 1-4 hours).
 */
async function fetchAtRiskUsers(): Promise<string[]> {
  const now = Math.floor(Date.now() / 1000);
  const TWENTY_HOURS = 20 * 60 * 60;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60;

  const gql = `
    query AtRisk($minLast: BigInt!, $maxLast: BigInt!) {
      users(
        first: 500
        where: {
          isActive: true
          streak_gt: 0
          lastUpdatedAt_gte: $minLast
          lastUpdatedAt_lte: $maxLast
        }
      ) {
        id
      }
    }
  `;

  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: gql,
      variables: {
        minLast: String(now - TWENTY_FOUR_HOURS),
        maxLast: String(now - TWENTY_HOURS),
      },
    }),
  });

  const json = await res.json();
  return (json.data?.users ?? []).map((u: { id: string }) => u.id);
}

async function sendPush(
  subscription: webpush.PushSubscription,
  payload: { title: string; body: string; url: string; tag: string },
) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  } catch (err: any) {
    // 410 = subscription expired / user unsubscribed
    if (err?.statusCode === 410) return "expired";
    return "error";
  }
  return "ok";
}

async function fetchLowHealthUsers(): Promise<string[]> {
  const gql = `
    query LowHealth {
      users(
        first: 500
        where: { isActive: true, health_gt: 0, health_lt: 30 }
      ) {
        id
      }
    }
  `;

  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: gql }),
  });

  const json = await res.json();
  return (json.data?.users ?? []).map((u: { id: string }) => u.id);
}

async function sendBatchNotifications(
  addresses: string[],
  payload: { title: string; body: string; url: string; tag: string },
): Promise<{ sent: number; expiredAddresses: string[] }> {
  if (addresses.length === 0) return { sent: 0, expiredAddresses: [] };

  const { data: subs } = await getSupabase()
    .from("push_subscriptions")
    .select("address, subscription")
    .in("address", addresses);

  if (!subs || subs.length === 0) return { sent: 0, expiredAddresses: [] };

  const expiredAddresses: string[] = [];
  await Promise.all(
    subs.map(async ({ address, subscription }) => {
      const result = await sendPush(subscription as webpush.PushSubscription, payload);
      if (result === "expired") expiredAddresses.push(address);
    }),
  );

  return { sent: subs.length - expiredAddresses.length, expiredAddresses };
}

/**
 * GET /api/notifications/cron
 * Called by Vercel Cron every hour.
 * Guarded by CRON_SECRET to prevent public abuse.
 */
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    initWebPush();

    const [atRiskAddresses, lowHealthAddresses] = await Promise.all([
      fetchAtRiskUsers(),
      fetchLowHealthUsers(),
    ]);

    const [streakResult, healthResult] = await Promise.all([
      sendBatchNotifications(atRiskAddresses, {
        title: "🔥 Your streak is at risk!",
        body: "Focus for just a few minutes today to keep your streak alive.",
        url: "/app",
        tag: "streak-alert",
      }),
      sendBatchNotifications(lowHealthAddresses, {
        title: "❤️ Your pet is struggling!",
        body: "Feed your pet now before its health hits zero.",
        url: "/app",
        tag: "health-alert",
      }),
    ]);

    // Clean up all expired subscriptions in one batch
    const allExpired = [...new Set([...streakResult.expiredAddresses, ...healthResult.expiredAddresses])];
    if (allExpired.length > 0) {
      await getSupabase().from("push_subscriptions").delete().in("address", allExpired);
    }

    return NextResponse.json({
      streak: { sent: streakResult.sent },
      health: { sent: healthResult.sent },
      expired: allExpired.length,
    });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: "Cron failed" }, { status: 500 });
  }
}
