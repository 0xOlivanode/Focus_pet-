import { NextRequest, NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
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

/**
 * POST — called by QStash 60s before a user's focus session ends.
 * Verifies the QStash signature, checks the reminder hasn't been cancelled,
 * then sends a push notification.
 */
export async function POST(req: NextRequest) {
  // ── 1. Verify this request is genuinely from QStash ──────────────────────
  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  });

  const body = await req.text();

  const isValid = await receiver
    .verify({
      signature: req.headers.get("upstash-signature") ?? "",
      body,
    })
    .catch(() => false);

  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── 2. Parse payload ──────────────────────────────────────────────────────
  let address: string;
  try {
    ({ address } = JSON.parse(body));
    if (!address) throw new Error("missing address");
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = getSupabase();

  // ── 3. Check reminder hasn't been cancelled ───────────────────────────────
  const { data: reminder } = await supabase
    .from("focus_reminders")
    .select("cancelled")
    .eq("address", address)
    .single();

  if (!reminder || reminder.cancelled) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // ── 4. Fetch push subscription ────────────────────────────────────────────
  const { data: sub } = await supabase
    .from("push_subscriptions")
    .select("subscription")
    .eq("address", address)
    .single();

  if (!sub?.subscription) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // ── 5. Send push notification ─────────────────────────────────────────────
  try {
    initWebPush();
    await webpush.sendNotification(
      sub.subscription as webpush.PushSubscription,
      JSON.stringify({
        title: "⏱ 1 minute left!",
        body: "Your focus session is almost done — come back to record it and earn XP.",
        url: "/app",
        tag: "focus-reminder",
      }),
    );
  } catch (err: any) {
    // Subscription expired — clean up
    if (err?.statusCode === 410) {
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("address", address);
    }
    console.error("Focus fire push error:", err);
  }

  // ── 6. Clean up the reminder row ──────────────────────────────────────────
  await supabase.from("focus_reminders").delete().eq("address", address);

  return NextResponse.json({ ok: true });
}
