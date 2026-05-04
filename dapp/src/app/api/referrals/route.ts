import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isAddress } from "viem";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as const;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET /api/referrals?address=0x...
// Returns the stored inviter for the given wallet address.
// Used by the frontend before signing a claim — so the inviter is server-determined.
export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");

  if (!address || !isAddress(address)) {
    return NextResponse.json({ inviter: ZERO_ADDRESS });
  }

  const { data, error } = await supabase
    .from("referrals")
    .select("inviter_address")
    .eq("invitee_address", address.toLowerCase())
    .maybeSingle();

  if (error) {
    console.error("[referrals GET]", error);
    return NextResponse.json({ inviter: ZERO_ADDRESS });
  }

  return NextResponse.json({
    inviter: (data?.inviter_address as `0x${string}`) || ZERO_ADDRESS,
  });
}

// POST /api/referrals
// Persists { invitee, inviter } to DB. First referral wins (ignoreDuplicates).
// Called by ReferralTracker as soon as the wallet address is known.
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { invitee, inviter } = body;

  if (!invitee || !inviter || !isAddress(invitee) || !isAddress(inviter)) {
    return NextResponse.json({ error: "Invalid addresses" }, { status: 400 });
  }

  // Silently ignore self-referrals
  if (invitee.toLowerCase() === inviter.toLowerCase()) {
    return NextResponse.json({ ok: true });
  }

  // Check if this invitee already has a referral (first referral wins)
  const { data: existing } = await supabase
    .from("referrals")
    .select("invitee_address")
    .eq("invitee_address", invitee.toLowerCase())
    .maybeSingle();

  if (existing) return NextResponse.json({ ok: true });

  const { error } = await supabase.from("referrals").insert({
    invitee_address: invitee.toLowerCase(),
    inviter_address: inviter.toLowerCase(),
  });

  if (error) {
    console.error("[referrals POST]", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
