import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { createClient } from "@supabase/supabase-js";
import { CONTRACT_ADDRESS } from "@/config/contracts";

// ── Tunables ────────────────────────────────────────────────────────────────
const AMOUNT        = parseEther("0.01");  // enough for ~20-80 txns on Celo
const THRESHOLD     = parseEther("0.002"); // only fund if wallet is nearly empty
const REGRANT_DAYS  = 3;                   // days between top-ups for returning users
const IP_DAILY_CAP  = 1;                   // 1 wallet per IP per 24 h
// ────────────────────────────────────────────────────────────────────────────

// Minimal ABI — only what we need to verify on-chain pet ownership
const PETS_ABI = [
  {
    name: "pets",
    type: "function",
    inputs: [{ name: "", type: "address" as const }],
    outputs: [
      { name: "xp",              type: "uint256" as const },
      { name: "health",          type: "uint256" as const },
      { name: "lastInteraction", type: "uint256" as const },
      { name: "birthTime",       type: "uint256" as const },
      { name: "username",        type: "string"  as const },
      { name: "petName",         type: "string"  as const },
      { name: "streak",          type: "uint256" as const },
      { name: "boostEndTime",    type: "uint256" as const },
      { name: "shieldCount",     type: "uint256" as const },
      { name: "activeCosmetic",  type: "string"  as const },
      { name: "totalDonated",    type: "uint256" as const },
      { name: "totalFocusTime",  type: "uint256" as const },
    ],
    stateMutability: "view" as const,
  },
] as const;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  try {
    const { address } = await req.json();

    // ── 1. Input validation ────────────────────────────────────────────────
    if (!address || !isAddress(address)) {
      return NextResponse.json({ error: "Invalid address" }, { status: 400 });
    }

    const TREASURY_PRIVATE_KEY = (
      process.env.TREASURY_PRIVATE_KEY || process.env.APP_PRIVATE_KEY
    ) as `0x${string}`;

    if (!TREASURY_PRIVATE_KEY) {
      return NextResponse.json({ error: "Faucet not configured" }, { status: 500 });
    }

    const normalized   = address.toLowerCase();
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const supabase     = getSupabase();
    const publicClient = createPublicClient({ chain: celo, transport: http() });

    // ── 2. Balance check — only fund nearly-empty wallets ─────────────────
    const balance = await publicClient.getBalance({
      address: address as `0x${string}`,
    });
    if (balance >= THRESHOLD) {
      return NextResponse.json({
        success: true, funded: false, message: "Sufficient balance.",
      });
    }

    // ── 3. Nonce — tells us first-timer vs returning user ─────────────────
    const nonce = await publicClient.getTransactionCount({
      address: address as `0x${string}`,
    });

    // ── 4. Check existing grant record ────────────────────────────────────
    const { data: existing } = await supabase
      .from("faucet_grants")
      .select("address, last_funded_at, grant_count")
      .eq("address", normalized)
      .maybeSingle();

    if (!existing) {
      // ── FIRST-TIME GRANT ─────────────────────────────────────────────────
      // Only fund brand-new wallets (nonce = 0). If they've already sent
      // transactions they had gas from somewhere else.
      if (nonce > 0) {
        return NextResponse.json({
          success: true, funded: false,
          message: "Wallet already has transaction history.",
        });
      }
    } else {
      // ── RE-GRANT (returning user who ran dry) ────────────────────────────

      // Must have used the gas we gave them
      if (nonce === 0) {
        return NextResponse.json({
          success: true, funded: false, message: "Previous gas still unused.",
        });
      }

      // ── On-chain verification: must have a hatched pet ──────────────────
      // This is the bot-killer. Hatching costs gas, so no bot will spend
      // gas just to qualify for a 0.005 CELO top-up.
      // `birthTime > 0` means they've done at least the hatch transaction.
      // `totalFocusTime > 0` means they've completed at least one session.
      // We check totalFocusTime so we know they've genuinely used the app.
      let petData: any;
      try {
        petData = await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: PETS_ABI,
          functionName: "pets",
          args: [address as `0x${string}`],
        });
      } catch {
        return NextResponse.json({
          success: true, funded: false,
          message: "Could not verify on-chain pet status.",
        });
      }

      const hasPet       = (petData as any).birthTime > 0n;
      const hasUsedApp   = (petData as any).totalFocusTime > 0n;

      if (!hasPet || !hasUsedApp) {
        return NextResponse.json({
          success: true, funded: false,
          message: "Complete at least one focus session to qualify for a top-up.",
        });
      }

      // Must wait REGRANT_DAYS between top-ups
      const daysSince = (Date.now() - new Date(existing.last_funded_at).getTime())
        / (1000 * 60 * 60 * 24);

      if (daysSince < REGRANT_DAYS) {
        const daysLeft = Math.ceil(REGRANT_DAYS - daysSince);
        return NextResponse.json({
          success: true, funded: false,
          message: `Next top-up in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        });
      }
    }

    // ── 5. IP rate limiting — max 2 wallets per IP per 24 h ──────────────
    if (ip !== "unknown") {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("faucet_grants")
        .select("*", { count: "exact", head: true })
        .eq("ip", ip)
        .gte("last_funded_at", since);

      if ((count ?? 0) >= IP_DAILY_CAP) {
        return NextResponse.json(
          { error: "Too many requests from this network. Try again tomorrow." },
          { status: 429 },
        );
      }
    }

    // ── 6. Faucet self-protection — keep a reserve ────────────────────────
    const safeKey = TREASURY_PRIVATE_KEY.startsWith("0x")
      ? TREASURY_PRIVATE_KEY
      : (`0x${TREASURY_PRIVATE_KEY}` as `0x${string}`);
    const account = privateKeyToAccount(safeKey);

    const faucetBalance = await publicClient.getBalance({
      address: account.address,
    });
    if (faucetBalance < AMOUNT * BigInt(5)) {
      console.warn("Faucet wallet critically low:", faucetBalance.toString());
      return NextResponse.json(
        { error: "Faucet temporarily unavailable. Contact support." },
        { status: 503 },
      );
    }

    // ── 7. Send gas ────────────────────────────────────────────────────────
    const walletClient = createWalletClient({
      account, chain: celo, transport: http(),
    });

    const hash = await walletClient.sendTransaction({
      to: address as `0x${string}`,
      value: AMOUNT,
    });

    // ── 8. Upsert grant record ─────────────────────────────────────────────
    await supabase.from("faucet_grants").upsert(
      {
        address:        normalized,
        ip,
        tx_hash:        hash,
        amount:         "0.01",
        last_funded_at: new Date().toISOString(),
        grant_count:    (existing?.grant_count ?? 0) + 1,
      },
      { onConflict: "address" },
    );

    console.log(
      `Faucet: sent 0.01 CELO to ${normalized} ` +
      `(grant #${(existing?.grant_count ?? 0) + 1}, tx: ${hash})`,
    );

    return NextResponse.json({ success: true, funded: true, hash });
  } catch (error: any) {
    console.error("Faucet Error:", error);
    return NextResponse.json(
      { error: "Failed to process faucet request" },
      { status: 500 },
    );
  }
}
