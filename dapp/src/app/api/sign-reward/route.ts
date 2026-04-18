import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, createPublicClient, http, isAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";
import { EngagementRewardsSDK } from "@goodsdks/engagement-sdk";
import { PrivyClient } from "@privy-io/server-auth";
import { fetchUserHistory } from "@/lib/subgraph";

// ── Config ───────────────────────────────────────────────────────────────────
const REWARDS_CONTRACT = (
  process.env.NEXT_PUBLIC_ENGAGEMENT_REWARDS_CONTRACT ||
  "0x25db74CF4E7BA120526fd87e159CF656d94bAE43"
) as `0x${string}`;

const MIN_SESSION_DAYS = 2;

const pkRaw = process.env.APP_PRIVATE_KEY;
const PRIVATE_KEY = pkRaw
  ? pkRaw.startsWith("0x") ? pkRaw : `0x${pkRaw}`
  : undefined;

// ── Handler ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // ── 1. Require app private key ──────────────────────────────────────────
    if (!PRIVATE_KEY) {
      console.error("APP_PRIVATE_KEY not configured");
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    // ── 2. Privy auth — must be a logged-in user ────────────────────────────
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let privyUserId: string;
    let claimerAddress: string;
    try {
      const privy = new PrivyClient(
        process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
        process.env.PRIVY_APP_SECRET!,
      );
      const claims = await privy.verifyAuthToken(token);
      privyUserId = claims.userId;

      // Fetch user to cross-check the address belongs to this Privy account
      const user = await privy.getUser(privyUserId);
      const ownedAddresses = (user.linkedAccounts ?? [])
        .filter((a: any) => a.type === "wallet" || a.type === "smart_wallet")
        .map((a: any) => (a.address as string).toLowerCase());

      const body = await req.json();
      const { user: userAddress, validUntilBlock, inviter } = body;

      if (!userAddress || !validUntilBlock || !isAddress(userAddress)) {
        return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
      }

      if (!ownedAddresses.includes(userAddress.toLowerCase())) {
        return NextResponse.json(
          { error: "Address not associated with your account" },
          { status: 403 },
        );
      }

      claimerAddress = userAddress;

      // ── 3. Verify minimum session days via subgraph ─────────────────────
      try {
        const history = await fetchUserHistory(claimerAddress, 30);
        const sessionDays = history?.dailyActivities?.length ?? 0;
        if (sessionDays < MIN_SESSION_DAYS) {
          return NextResponse.json(
            { error: `Need at least ${MIN_SESSION_DAYS} days of focus sessions.` },
            { status: 403 },
          );
        }
      } catch (subgraphErr) {
        // Non-blocking: if subgraph is down, let the contract enforce it
        console.warn("Subgraph check failed, proceeding:", subgraphErr);
      }

      // ── 4. Sign the claim with app private key ──────────────────────────
      const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);
      const publicClient = createPublicClient({ chain: celo, transport: http() });
      const walletClient = createWalletClient({ account, chain: celo, transport: http() });

      const sdk = new EngagementRewardsSDK(publicClient as any, walletClient as any, REWARDS_CONTRACT);

      const { domain, types, message } = await sdk.prepareAppSignature(
        account.address,
        claimerAddress as `0x${string}`,
        BigInt(validUntilBlock),
      );

      const signature = await walletClient.signTypedData({
        domain,
        types,
        primaryType: "AppClaim",
        message,
      });

      console.log(`Engagement reward signed for ${claimerAddress} (privy: ${privyUserId})`);

      return NextResponse.json({
        signature,
        appAddress: account.address,
      });
    } catch (authErr: any) {
      if (authErr?.status === 400 || authErr?.status === 401) {
        return NextResponse.json({ error: "Invalid auth token" }, { status: 401 });
      }
      throw authErr;
    }
  } catch (error: any) {
    console.error("Sign reward error:", error);
    return NextResponse.json({ error: "Failed to sign reward" }, { status: 500 });
  }
}
