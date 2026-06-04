import { NextRequest, NextResponse } from "next/server";
import {
  createPublicClient,
  createWalletClient,
  http,
  fallback,
  parseEther,
  isAddress,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { createClient } from "@supabase/supabase-js";

// ── Tunables ────────────────────────────────────────────────────────────────
const AMOUNT       = parseEther("0.1");  // enough for ~200-800 txns on Celo
const THRESHOLD    = parseEther("0.01"); // only fund if wallet is running low
const COOLDOWN_H   = 48;                 // hours between top-ups per address
const IP_DAILY_CAP = 1;                  // addresses per IP per 24 h (when IP is available)

// Admin test accounts — bypass all checks.
const ADMIN_BYPASS = new Set(
  (process.env.FAUCET_ADMIN_BYPASS || "")
    .split(",")
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean),
);
// ────────────────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  return NextResponse.json(
    { error: "Faucet is temporarily unavailable. Contact support to receive gas." },
    { status: 503 },
  );

  // eslint-disable-next-line no-unreachable
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

    const normalized = address.toLowerCase();
    const safeKey = TREASURY_PRIVATE_KEY.startsWith("0x")
      ? TREASURY_PRIVATE_KEY
      : (`0x${TREASURY_PRIVATE_KEY}` as `0x${string}`);
    const account = privateKeyToAccount(safeKey);

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const celoTransport = fallback([
      http("https://rpc.ankr.com/celo"),
      http("https://forno.celo.org"),
      http("https://1rpc.io/celo"),
    ]);
    const publicClient = createPublicClient({ chain: celo, transport: celoTransport });
    const supabase = getSupabase();

    // ── Admin bypass ───────────────────────────────────────────────────────
    if (ADMIN_BYPASS.has(normalized)) {
      const faucetBal = await publicClient.getBalance({ address: account.address });
      if (faucetBal < AMOUNT * 5n) {
        return NextResponse.json({ error: "Faucet critically low." }, { status: 503 });
      }
      const walletClient = createWalletClient({ account, chain: celo, transport: celoTransport });
      const hash = await walletClient.sendTransaction({
        to: address as `0x${string}`,
        value: AMOUNT,
      });
      console.log(`Faucet [ADMIN BYPASS]: sent 0.1 CELO to ${normalized} (tx: ${hash})`);
      return NextResponse.json({ success: true, funded: true, hash });
    }

    // ── 3. Balance check ───────────────────────────────────────────────────
    const balance = await publicClient.getBalance({ address: address as `0x${string}` });
    if (balance >= THRESHOLD) {
      return NextResponse.json({ success: true, funded: false, message: "Sufficient balance." });
    }

    // ── 5. Per-address cooldown ────────────────────────────────────────────
    // Fetch tx_hash too — failed/pending rows must NOT trigger a cooldown.
    // If the previous tx failed, the user should be able to retry immediately.
    // Balance check (step 3) already handles the case where a pending tx landed.
    const { data: existing, error: selectError } = await supabase
      .from("faucet_grants")
      .select("last_funded_at, grant_count, tx_hash")
      .eq("address", normalized)
      .maybeSingle();

    if (selectError) {
      console.error("Faucet Supabase SELECT error:", selectError);
      return NextResponse.json({ error: "Faucet temporarily unavailable." }, { status: 503 });
    }

    const lastTxSucceeded =
      existing != null &&
      existing!.tx_hash !== "failed" &&
      existing!.tx_hash !== "pending";

    if (lastTxSucceeded) {
      const hoursSince =
        (Date.now() - new Date(existing!.last_funded_at).getTime()) / (1000 * 60 * 60);
      if (hoursSince < COOLDOWN_H) {
        const hoursLeft = Math.ceil(COOLDOWN_H - hoursSince);
        return NextResponse.json({
          success: true, funded: false,
          message: `Next top-up available in ${hoursLeft}h.`,
        });
      }
    }

    // ── 6. IP rate limiting ────────────────────────────────────────────────
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

    // ── 7. Faucet self-protection ──────────────────────────────────────────
    const faucetBalance = await publicClient.getBalance({ address: account.address });
    if (faucetBalance < AMOUNT * 5n) {
      console.warn("Faucet wallet critically low:", faucetBalance.toString());
      return NextResponse.json(
        { error: "Faucet temporarily unavailable. Contact support." },
        { status: 503 },
      );
    }

    // ── 8. Reserve slot (race-condition protection) ────────────────────────
    const nextCount = (existing?.grant_count ?? 0) + 1;
    const reserveResult = existing
      ? await supabase.from("faucet_grants").update({
          ip, tx_hash: "pending", amount: "0.1",
          last_funded_at: new Date().toISOString(), grant_count: nextCount,
        }).eq("address", normalized)
      : await supabase.from("faucet_grants").insert({
          address: normalized, ip,
          tx_hash: "pending", amount: "0.1",
          last_funded_at: new Date().toISOString(), grant_count: nextCount,
        });

    if (reserveResult.error) {
      console.error("Faucet reserve failed (possible race):", reserveResult.error);
      return NextResponse.json(
        { error: "Faucet temporarily unavailable. Try again." },
        { status: 503 },
      );
    }

    // ── 8. Send gas ────────────────────────────────────────────────────────
    const walletClient = createWalletClient({ account, chain: celo, transport: celoTransport });
    let hash: `0x${string}`;
    try {
      hash = await walletClient.sendTransaction({
        to: address as `0x${string}`,
        value: AMOUNT,
      });
    } catch (sendError) {
      await supabase
        .from("faucet_grants")
        .update({ tx_hash: "failed", grant_count: existing?.grant_count ?? 0 })
        .eq("address", normalized);
      throw sendError;
    }

    await supabase.from("faucet_grants").update({ tx_hash: hash }).eq("address", normalized);

    console.log(
      `Faucet: sent 0.1 CELO to ${normalized} (grant #${nextCount}, tx: ${hash})`,
    );

    return NextResponse.json({ success: true, funded: true, hash });
  } catch (error: any) {
    console.error("Faucet Error:", error);
    return NextResponse.json({ error: "Failed to process faucet request" }, { status: 500 });
  }
}
