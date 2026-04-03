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

// Admin test accounts — bypass all checks, get gas on demand.
// Comma-separated lowercase addresses in FAUCET_ADMIN_BYPASS env var.
const ADMIN_BYPASS = new Set(
  (process.env.FAUCET_ADMIN_BYPASS || "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean),
);
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
      { name: "streak",           type: "uint256" as const },
      { name: "lastDailySession", type: "uint256" as const },
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

    // ── Admin bypass — test accounts skip all checks ───────────────────────
    if (ADMIN_BYPASS.has(normalized)) {
      const safeKeyAdmin = (process.env.TREASURY_PRIVATE_KEY || process.env.APP_PRIVATE_KEY) as `0x${string}`;
      const accountAdmin = privateKeyToAccount(
        safeKeyAdmin.startsWith("0x") ? safeKeyAdmin : `0x${safeKeyAdmin}`,
      );
      const balanceAdmin = await createPublicClient({ chain: celo, transport: http() })
        .getBalance({ address: accountAdmin.address });
      if (balanceAdmin < parseEther("0.01") * BigInt(5)) {
        return NextResponse.json({ error: "Faucet critically low." }, { status: 503 });
      }
      const walletAdmin = createWalletClient({ account: accountAdmin, chain: celo, transport: http() });
      const hashAdmin   = await walletAdmin.sendTransaction({
        to: address as `0x${string}`,
        value: parseEther("0.01"),
      });
      console.log(`Faucet [ADMIN BYPASS]: sent 0.01 CELO to ${normalized} (tx: ${hashAdmin})`);
      return NextResponse.json({ success: true, funded: true, hash: hashAdmin });
    }

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

    // ── Shared on-chain pet lookup (used in multiple paths below) ─────────
    const fetchPetData = async () => {
      try {
        return await publicClient.readContract({
          address: CONTRACT_ADDRESS as `0x${string}`,
          abi: PETS_ABI,
          functionName: "pets",
          args: [address as `0x${string}`],
        });
      } catch {
        return null;
      }
    };

    if (!existing) {
      if (nonce === 0) {
        // ── FIRST-TIME GRANT ───────────────────────────────────────────────
        // Brand-new wallet, never sent a tx → needs gas to hatch. Grant immediately.

      } else {
        // ── PRE-FAUCET EXISTING USER ───────────────────────────────────────
        // Wallet has tx history but no faucet record. Two cases:
        //   A) Legitimate user who used the app before the faucet existed.
        //   B) Wallet that sent txns elsewhere (not our app).
        // Distinguish via on-chain pet: only case A will have birthTime > 0
        // AND totalFocusTime > 0.
        const petData = await fetchPetData();
        if (!petData) {
          return NextResponse.json({
            success: true, funded: false,
            message: "Could not verify on-chain pet status.",
          });
        }
        const p = petData as readonly any[];
        const hasPet     = BigInt(p[3]  ?? 0) > 0n; // birthTime      at index 3
        const hasUsedApp = BigInt(p[12] ?? 0) > 0n; // totalFocusTime at index 12
        if (!hasPet || !hasUsedApp) {
          return NextResponse.json({
            success: true, funded: false,
            message: "Wallet already has transaction history.",
          });
        }
        // Legitimate pre-faucet user — fall through to grant.
      }
    } else {
      // ── RE-GRANT (returning user who ran dry) ────────────────────────────

      // Must have used the gas we gave them
      if (nonce === 0) {
        return NextResponse.json({
          success: true, funded: false, message: "Previous gas still unused.",
        });
      }

      // Cooldown check first — cheaper than an RPC call
      const daysSince = (Date.now() - new Date(existing.last_funded_at).getTime())
        / (1000 * 60 * 60 * 24);

      if (daysSince < REGRANT_DAYS) {
        const daysLeft = Math.ceil(REGRANT_DAYS - daysSince);
        return NextResponse.json({
          success: true, funded: false,
          message: `Next top-up in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.`,
        });
      }

      // ── On-chain verification ───────────────────────────────────────────
      const petData = await fetchPetData();
      if (!petData) {
        return NextResponse.json({
          success: true, funded: false,
          message: "Could not verify on-chain pet status.",
        });
      }

      const rp = petData as readonly any[];
      const hasPet     = BigInt(rp[3]  ?? 0) > 0n; // birthTime      at index 3
      const hasUsedApp = BigInt(rp[12] ?? 0) > 0n; // totalFocusTime at index 12

      if (hasPet && !hasUsedApp) {
        // Hatched but hasn't completed a session yet
        return NextResponse.json({
          success: true, funded: false,
          message: "Complete at least one focus session to qualify for a top-up.",
        });
      }

      // hasPet && hasUsedApp → active user, grant ✓
      // !hasPet (birthTime = 0) → admin-deleted or self-deleted user who needs
      // gas to re-hatch. Cooldown already passed above, so allow the re-grant.
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

    // ── 7. Reserve the grant slot before sending ──────────────────────────
    // Insert/update FIRST with a placeholder tx_hash. If two concurrent
    // requests race, the DB unique constraint on `address` ensures only one
    // wins — the loser gets a duplicate-key error and never sends CELO.
    const nextCount = (existing?.grant_count ?? 0) + 1;
    const reserveResult = existing
      ? await supabase.from("faucet_grants").update({
          ip,
          tx_hash:        "pending",
          amount:         "0.01",
          last_funded_at: new Date().toISOString(),
          grant_count:    nextCount,
        }).eq("address", normalized)
      : await supabase.from("faucet_grants").insert({
          address:        normalized,
          ip,
          tx_hash:        "pending",
          amount:         "0.01",
          last_funded_at: new Date().toISOString(),
          grant_count:    nextCount,
        });

    if (reserveResult.error) {
      console.error("Faucet reserve failed (possible race):", reserveResult.error);
      return NextResponse.json(
        { error: "Faucet temporarily unavailable. Try again." },
        { status: 503 },
      );
    }

    // ── 8. Send gas ────────────────────────────────────────────────────────
    const walletClient = createWalletClient({
      account, chain: celo, transport: http(),
    });

    let hash: `0x${string}`;
    try {
      hash = await walletClient.sendTransaction({
        to: address as `0x${string}`,
        value: AMOUNT,
      });
    } catch (sendError) {
      // Transaction failed — roll back the reservation so user can retry
      await supabase.from("faucet_grants")
        .update({ tx_hash: "failed", grant_count: existing?.grant_count ?? 0 })
        .eq("address", normalized);
      throw sendError;
    }

    // ── 9. Write confirmed tx hash ─────────────────────────────────────────
    await supabase.from("faucet_grants")
      .update({ tx_hash: hash })
      .eq("address", normalized);

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
