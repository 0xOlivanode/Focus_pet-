import { NextRequest, NextResponse } from "next/server";
import {
  createWalletClient,
  createPublicClient,
  http,
  isAddress,
  verifyTypedData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { createClient } from "@supabase/supabase-js";
import { EngagementRewardsSDK } from "@goodsdks/engagement-sdk";
import { fetchUserHistory } from "@/lib/subgraph";
import {
  ENGAGEMENT_APP_ADDRESS,
  ENGAGEMENT_MIN_DAYS,
} from "@/config/contracts";

// ── Config ───────────────────────────────────────────────────────────────────
const REWARDS_CONTRACT = (process.env.NEXT_PUBLIC_ENGAGEMENT_REWARDS_CONTRACT ||
  "0x25db74CF4E7BA120526fd87e159CF656d94bAE43") as `0x${string}`;

const pkRaw = process.env.APP_PRIVATE_KEY;
const PRIVATE_KEY = pkRaw
  ? pkRaw.startsWith("0x")
    ? pkRaw
    : `0x${pkRaw}`
  : undefined;

const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as `0x${string}`;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// Reads the stored inviter for a given wallet address from Supabase.
async function getInviterFromDB(userAddress: string): Promise<`0x${string}`> {
  const { data } = await supabase
    .from("referrals")
    .select("inviter_address")
    .eq("invitee_address", userAddress.toLowerCase())
    .maybeSingle();
  return (data?.inviter_address as `0x${string}`) || ZERO_ADDRESS;
}

// ── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    if (!PRIVATE_KEY) {
      console.error("APP_PRIVATE_KEY not configured");
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 },
      );
    }

    if (!ENGAGEMENT_APP_ADDRESS) {
      console.error("NEXT_PUBLIC_APP_ADDRESS not configured");
      return NextResponse.json(
        { error: "Server not configured" },
        { status: 500 },
      );
    }

    // ── 1. Parse and validate body ──────────────────────────────────────────
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { user: userAddress, validUntilBlock, userSignature } = body;

    if (
      !userAddress ||
      !validUntilBlock ||
      !userSignature ||
      !isAddress(userAddress)
    ) {
      return NextResponse.json(
        { error: "Invalid parameters" },
        { status: 400 },
      );
    }

    // ── 2. Read authoritative inviter from DB ───────────────────────────────
    // Inviter is always server-determined — not accepted from the client.
    // The frontend fetches this same value from GET /api/referrals before signing,
    // so both sides use the same inviter when building/verifying the EIP-712 message.
    const inviter = await getInviterFromDB(userAddress);

    // ── 3. Verify the user's EIP-712 claim signature ────────────────────────
    // Works for all auth types (Privy, Web3Auth, MiniPay) — no third-party
    // auth token needed. The same signature is used on-chain by nonContractAppClaim.
    try {
      const publicClient = createPublicClient({
        chain: celo,
        transport: http(
          "https://celo-mainnet.g.alchemy.com/v2/YcblzW7m_-ItUCMj1Mu17",
        ),
      });
      const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
      const walletClient = createWalletClient({
        account,
        chain: celo,
        transport: http(
          "https://celo-mainnet.g.alchemy.com/v2/YcblzW7m_-ItUCMj1Mu17",
        ),
      });

      const sdk = new EngagementRewardsSDK(
        publicClient as any,
        walletClient as any,
        REWARDS_CONTRACT,
      );

      // Reconstruct the exact typed data the frontend signed over.
      const appInfo = await sdk.getAppInfo(ENGAGEMENT_APP_ADDRESS);
      const appDescription = appInfo[9] as string;

      const { domain, types, message } = await sdk.prepareClaimSignature(
        ENGAGEMENT_APP_ADDRESS,
        inviter,
        BigInt(validUntilBlock),
        appDescription,
      );

      const isValid = await verifyTypedData({
        address: userAddress as `0x${string}`,
        domain: domain as any,
        types,
        primaryType: "Claim",
        message: message as any,
        signature: userSignature as `0x${string}`,
      });

      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 401 },
        );
      }

      // ── 4. Verify minimum session days via subgraph ─────────────────────
      try {
        const history = await fetchUserHistory(userAddress, 30);
        const sessionDays = history?.dailyActivities?.length ?? 0;
        if (sessionDays < ENGAGEMENT_MIN_DAYS) {
          return NextResponse.json(
            {
              error: `Need at least ${ENGAGEMENT_MIN_DAYS} days of focus sessions.`,
            },
            { status: 403 },
          );
        }
      } catch (subgraphErr) {
        // Non-blocking: if subgraph is down let the contract enforce it
        console.warn("Subgraph check failed, proceeding:", subgraphErr);
      }

      // ── 5. Sign the claim with app private key ──────────────────────────
      const {
        domain: appDomain,
        types: appTypes,
        message: appMessage,
      } = await sdk.prepareAppSignature(
        ENGAGEMENT_APP_ADDRESS,
        userAddress as `0x${string}`,
        BigInt(validUntilBlock),
      );

      const signature = await walletClient.signTypedData({
        domain: appDomain,
        types: appTypes,
        primaryType: "AppClaim",
        message: appMessage,
      });

      console.log(
        `Engagement reward signed for ${userAddress} (inviter: ${inviter})`,
      );

      // Return inviter so the frontend can pass the exact same value to nonContractAppClaim.
      return NextResponse.json({
        signature,
        appAddress: account.address,
        inviter,
      });
    } catch (innerErr: any) {
      console.error("Sign reward inner error:", innerErr);
      throw innerErr;
    }
  } catch (error: any) {
    console.error("Sign reward error:", error);
    return NextResponse.json(
      { error: "Failed to sign reward" },
      { status: 500 },
    );
  }
}
