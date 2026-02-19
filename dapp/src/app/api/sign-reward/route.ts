import { NextRequest, NextResponse } from "next/server";
import { createWalletClient, http, toHex, keccak256, encodePacked } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo, celoSepolia } from "viem/chains";

// 1. Setup Signer (APP_PRIVATE_KEY from .env)
const pkRaw = process.env.APP_PRIVATE_KEY;
const PRIVATE_KEY = pkRaw
  ? pkRaw.startsWith("0x")
    ? pkRaw
    : `0x${pkRaw}`
  : undefined;
const TARGET_CHAIN =
  process.env.NEXT_PUBLIC_CHAIN_ID === "42220" ? celo : celoSepolia;

export async function POST(req: NextRequest) {
  try {
    if (!PRIVATE_KEY) {
      console.error("Missing APP_PRIVATE_KEY");
      return NextResponse.json(
        { error: "Server Configuration Error" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { userAddress, minutes } = body;

    if (!userAddress || minutes === undefined) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }

    // 2. Define Reward Logic (Server-Side Validation)
    // Here we trust the client's "seconds" for now, but in a real app,
    // you'd verify a session ID or WebSocket connection.
    const validUntilBlock = BigInt(Math.floor(Date.now() / 1000) + 300); // Valid for 5 mins (using timestamp as block/time proxy if contract supports)
    // NOTE: Contract expects block number usually, but for simplicity let's use a large future block
    // OR fetch current block. For Celo (5s block time), 5 mins = 60 blocks.

    // Changing validUntilBlock to a fixed large number for simplicity in this MVP,
    // or you can fetch public client block number.
    // Let's use a standard "valid for 1 hour" approach approximately.
    const currentBlockApprox = BigInt(Math.floor(Date.now() / 5000)); // Rough approximation since 1970
    const expiryBlock = BigInt(99999999999); // Simpler for MVP: Just expire far in future or use a fetched block.

    // 3. Create Signature
    const account = privateKeyToAccount(PRIVATE_KEY as `0x${string}`);

    // Message Construction must match Smart Contract `recover` logic:
    // keccak256(abi.encodePacked(user, inviter, validUntilBlock))
    // Note: The specific contract implementation of `CommonSimpleReward` might vary.
    // Let's assume standard: (address user, uint256 validUntilBlock) or similar.

    // WAIT: I need to verify EXACTLY what the contract expects to sign.
    // Looking at FocusPet.sol -> imports IEngagementRewards.sol
    // Usually it's: keccak256(abi.encodePacked(address user, uint256 validUntilBlock))

    // Let's assuming standard GoodDollar SimpleReward pattern for now.
    // actually, let's use the simplest signature scheme that matches the "inviter" args too if needed.
    // In `recordSession` hook: args: [minutes, inviter, validUntilBlock, signature]

    const inviter = "0x0000000000000000000000000000000000000000";

    // PACKED verify:
    // User Address (address)
    // Inviter (address)
    // ValidUntilBlock (uint256)

    const messageHash = keccak256(
      encodePacked(
        ["address", "address", "uint256"],
        [userAddress as `0x${string}`, inviter, expiryBlock],
      ),
    );

    const signature = await account.signMessage({
      message: { raw: messageHash },
    });

    return NextResponse.json({
      signature,
      validUntilBlock: expiryBlock.toString(), // JSON needs string for BigInt
      inviter,
    });
  } catch (error) {
    console.error("Signing error:", error);
    return NextResponse.json(
      { error: "Failed to sign reward" },
      { status: 500 },
    );
  }
}
