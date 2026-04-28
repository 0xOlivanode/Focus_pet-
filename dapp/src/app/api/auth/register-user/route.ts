import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, email, authType } = await req.json();

    if (!walletAddress || typeof walletAddress !== "string") {
      return NextResponse.json({ error: "Missing wallet address" }, { status: 400 });
    }

    if (!["web3auth", "minipay"].includes(authType)) {
      return NextResponse.json({ error: "Invalid authType" }, { status: 400 });
    }

    const { error } = await supabase.from("users").upsert(
      {
        wallet_address: walletAddress.toLowerCase(),
        email: email ? email.toLowerCase().trim() : null,
        auth_type: authType,
      },
      {
        onConflict: "wallet_address",
        ignoreDuplicates: true, // don't overwrite existing records
      },
    );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[register-user]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
