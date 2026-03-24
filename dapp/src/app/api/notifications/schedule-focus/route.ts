import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const APP_URL = "https://focus-pet.xyz";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * POST — called by the client when a focus session starts.
 * Schedules a QStash message to fire 60s before the session ends.
 */
export async function POST(req: NextRequest) {
  try {
    const { address, endTime } = await req.json();
    if (!address || !endTime) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const delayMs = endTime - 60_000 - Date.now();

    // Store the reminder in Supabase (upsert so there's always just one per user)
    await getSupabase()
      .from("focus_reminders")
      .upsert(
        { address: address.toLowerCase(), end_time: endTime, cancelled: false },
        { onConflict: "address" },
      );

    // Only schedule with QStash if there's actually a minute or more left
    if (delayMs < 1000) {
      return NextResponse.json({ ok: true, scheduled: false });
    }

    const qstashRes = await fetch(
      `https://qstash.upstash.io/v2/publish/${APP_URL}/api/notifications/focus-fire`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
          "Content-Type": "application/json",
          "Upstash-Delay": `${Math.floor(delayMs / 1000)}s`,
          // Deduplicate by address — prevents double-firing if client retries
          "Upstash-Deduplication-Id": `focus-${address.toLowerCase()}-${endTime}`,
        },
        body: JSON.stringify({ address: address.toLowerCase(), endTime }),
      },
    );

    if (!qstashRes.ok) {
      const err = await qstashRes.text();
      console.error("QStash schedule error:", err);
      // Non-fatal — SW fallback still works on Android/desktop
      return NextResponse.json({ ok: true, scheduled: false });
    }

    return NextResponse.json({ ok: true, scheduled: true });
  } catch (err) {
    console.error("Schedule focus error:", err);
    return NextResponse.json({ error: "Failed to schedule" }, { status: 500 });
  }
}

/**
 * DELETE — called by the client when a session is paused or reset.
 * Marks the reminder as cancelled so focus-fire is a no-op.
 */
export async function DELETE(req: NextRequest) {
  try {
    const { address } = await req.json();
    if (!address) {
      return NextResponse.json({ error: "Missing address" }, { status: 400 });
    }

    await getSupabase()
      .from("focus_reminders")
      .update({ cancelled: true })
      .eq("address", address.toLowerCase());

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Cancel focus reminder error:", err);
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }
}
