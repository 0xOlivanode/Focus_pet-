import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  getAddress,
  verifyMessage,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { createClient } from "@supabase/supabase-js";

// ─── Config ───────────────────────────────────────────────────────────────────

const TREASURY_PRIVATE_KEY = (
  process.env.TREASURY_PRIVATE_KEY || process.env.APP_PRIVATE_KEY
) as `0x${string}`;

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Enough for ~5-10 txns on Celo
const AMOUNT_TO_SEND = parseEther("0.005");
// Only fund wallets below this balance
const BALANCE_THRESHOLD = parseEther("0.002");

// IP rate limit: max N claims per IP in a rolling window
const IP_CLAIM_LIMIT = 3;
const IP_WINDOW_HOURS = 24;

// How long a user must wait before requesting gas again
const REFILL_COOLDOWN_DAYS = 7;

// Signatures older than this are rejected (replay protection)
const SIGNATURE_MAX_AGE_SECONDS = 300; // 5 minutes

// FocusPet contract — used to verify the address has an active pet (for re-claims)
const FOCUSPET_CONTRACT = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const GET_PET_ABI = parseAbi([
  "function getPet(address owner) view returns (uint256 xp, uint256 health, uint256 lastInteraction, uint256 birthTime, string username, string petName, uint256 streak, uint256 lastDailySession, uint256 boostEndTime, uint256 shieldCount, string activeCosmetic, uint256 totalDonated, uint256 totalFocusTime)",
]);

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 0. Parse body ────────────────────────────────────────────────────────
    const body = await req.json();
    const { address: rawAddress, signature, timestamp } = body ?? {};

    if (!rawAddress || !signature || !timestamp) {
      return NextResponse.json(
        { error: "Missing required fields: address, signature, timestamp" },
        { status: 400 }
      );
    }

    // ── 1. Validate address format ───────────────────────────────────────────
    let address: `0x${string}`;
    try {
      address = getAddress(rawAddress);
    } catch {
      return NextResponse.json(
        { error: "Invalid wallet address" },
        { status: 400 }
      );
    }

    if (!TREASURY_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Treasury not configured" },
        { status: 500 }
      );
    }

    // ── 2. LAYER 1: Signature freshness (replay protection) ──────────────────
    // Rejects signatures older than 5 minutes to prevent replay attacks
    const now = Math.floor(Date.now() / 1000);
    if (typeof timestamp !== "number" || Math.abs(now - timestamp) > SIGNATURE_MAX_AGE_SECONDS) {
      return NextResponse.json(
        { error: "Signature expired. Please try again." },
        { status: 400 }
      );
    }

    // ── 3. LAYER 2: Signature verification (wallet ownership proof) ──────────
    // Reconstructs the exact message the client signed and verifies it
    // recovers to the claimed address. This proves the caller controls the wallet.
    const message = `FocusPet gas request\nAddress: ${address}\nTime: ${timestamp}`;
    let isValidSig: boolean;
    try {
      isValidSig = await verifyMessage({
        address,
        message,
        signature: signature as `0x${string}`,
      });
    } catch {
      isValidSig = false;
    }

    if (!isValidSig) {
      return NextResponse.json(
        { error: "Invalid signature. You must sign with the requesting wallet." },
        { status: 403 }
      );
    }

    // ── 4. Extract IP ────────────────────────────────────────────────────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // ── 5. LAYER 3: IP rate limiting ─────────────────────────────────────────
    // Limits how many distinct wallets one network can fund per day
    const windowStart = new Date(
      Date.now() - IP_WINDOW_HOURS * 60 * 60 * 1000
    ).toISOString();

    const { count: ipCount, error: ipErr } = await supabaseAdmin
      .from("faucet_claims")
      .select("*", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("claimed_at", windowStart);

    if (ipErr) {
      console.error("IP rate-limit check failed:", ipErr.message);
    } else if ((ipCount ?? 0) >= IP_CLAIM_LIMIT) {
      return NextResponse.json(
        {
          error: `Too many gas requests from your network. Max ${IP_CLAIM_LIMIT} per ${IP_WINDOW_HOURS}h.`,
          code: "IP_RATE_LIMITED",
        },
        { status: 429 }
      );
    }

    // ── 6. LAYER 4: Cooldown check (with active-user re-claim) ───────────────
    // First claim: always allowed (user needs gas just to hatch their pet).
    // Re-claims: only if 7+ days have passed AND the address has an active pet
    // on-chain — proving they actually used the app and exhausted gas legitimately.
    const { data: existing, error: lookupErr } = await supabaseAdmin
      .from("faucet_claims")
      .select("claimed_at")
      .eq("address", address.toLowerCase())
      .order("claimed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lookupErr) {
      console.error("Claim lookup failed:", lookupErr.message);
    } else if (existing) {
      const lastClaim = new Date(existing.claimed_at).getTime();
      const cooldownMs = REFILL_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
      const cooldownExpired = Date.now() - lastClaim >= cooldownMs;

      if (!cooldownExpired) {
        const nextRefill = new Date(lastClaim + cooldownMs).toISOString();
        return NextResponse.json(
          {
            error: `Gas refill available after cooldown. Next eligible: ${nextRefill}`,
            code: "COOLDOWN_ACTIVE",
            nextRefillAt: nextRefill,
          },
          { status: 429 }
        );
      }

      // Cooldown passed — verify the address has an active pet before re-funding.
      // A birthTime > 0 means they hatched and are a real user, not a drain-and-discard wallet.
      if (FOCUSPET_CONTRACT) {
        try {
          const publicClientForCheck = createPublicClient({ chain: celo, transport: http() });
          const pet = await publicClientForCheck.readContract({
            address: FOCUSPET_CONTRACT,
            abi: GET_PET_ABI,
            functionName: "getPet",
            args: [address],
          }) as unknown as [bigint, bigint, bigint, bigint, ...unknown[]];

          // pet tuple: [xp, health, lastInteraction, birthTime, ...]
          if (!pet || pet[3] === 0n) {
            return NextResponse.json(
              {
                error: "No active pet found. Hatch your pet before requesting a gas refill.",
                code: "NO_PET",
              },
              { status: 403 }
            );
          }
        } catch (e: any) {
          console.error("Pet check failed:", e?.message);
          // Fail open — don't block a real user over an RPC hiccup
        }
      }
    }

    // ── 7. Balance check ─────────────────────────────────────────────────────
    const publicClient = createPublicClient({ chain: celo, transport: http() });
    const balance = await publicClient.getBalance({ address });

    if (balance >= BALANCE_THRESHOLD) {
      return NextResponse.json({
        success: true,
        funded: false,
        message: "Address already has sufficient CELO for gas.",
      });
    }

    // ── 8. Send CELO ─────────────────────────────────────────────────────────
    const safeKey = TREASURY_PRIVATE_KEY.startsWith("0x")
      ? TREASURY_PRIVATE_KEY
      : (`0x${TREASURY_PRIVATE_KEY}` as `0x${string}`);

    const account = privateKeyToAccount(safeKey);
    const walletClient = createWalletClient({
      account,
      chain: celo,
      transport: http(),
    });

    const hash = await walletClient.sendTransaction({
      to: address,
      value: AMOUNT_TO_SEND,
    });

    // ── 9. Record the claim ──────────────────────────────────────────────────
    const { error: insertErr } = await supabaseAdmin
      .from("faucet_claims")
      .upsert(
        { address: address.toLowerCase(), ip, tx_hash: hash, claimed_at: new Date().toISOString() },
        { onConflict: "address" }
      );

    if (insertErr) {
      console.error("CRITICAL: faucet_claims insert failed for", address, insertErr.message);
    }

    return NextResponse.json({ success: true, funded: true, hash });
  } catch (error: any) {
    console.error("Faucet Error:", error);
    return NextResponse.json(
      { error: "Failed to process faucet request", details: error.message },
      { status: 500 }
    );
  }
}
