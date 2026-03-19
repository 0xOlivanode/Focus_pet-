import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { celo } from "viem/chains";

const TREASURY_PRIVATE_KEY = (process.env.TREASURY_PRIVATE_KEY ||
  process.env.APP_PRIVATE_KEY) as `0x${string}`;

export async function POST(req: Request) {
  try {
    const { address } = await req.json();

    if (!address) {
      return NextResponse.json(
        { error: "Wallet address is required" },
        { status: 400 },
      );
    }

    if (!TREASURY_PRIVATE_KEY) {
      return NextResponse.json(
        { error: "Treasury not configured" },
        { status: 500 },
      );
    }

    const publicClient = createPublicClient({
      chain: celo,
      transport: http(),
    });

    const balance = await publicClient.getBalance({
      address: address as `0x${string}`,
    });

    // 0.1 CELO
    const THRESHOLD = parseEther("0.1");

    if (balance >= THRESHOLD) {
      return NextResponse.json({
        success: true,
        funded: false,
        message: "User has sufficient funds.",
      });
    }

    const safePrivateKey = TREASURY_PRIVATE_KEY.startsWith("0x")
      ? TREASURY_PRIVATE_KEY
      : (`0x${TREASURY_PRIVATE_KEY}` as `0x${string}`);
      
    const account = privateKeyToAccount(safePrivateKey);
    const walletClient = createWalletClient({
      account,
      chain: celo,
      transport: http(),
    });

    // Send 0.2 CELO
    const AMOUNT_TO_SEND = parseEther("0.2");

    const hash = await walletClient.sendTransaction({
      to: address as `0x${string}`,
      value: AMOUNT_TO_SEND,
    });

    return NextResponse.json({
      success: true,
      funded: true,
      hash,
      message: "Gas station funded wallet.",
    });

    console.log("successfully sent gas");
  } catch (error: any) {
    console.error("Faucet Error:", error);
    return NextResponse.json(
      { error: "Failed to process faucet request", details: error.message },
      { status: 500 },
    );
  }
}
