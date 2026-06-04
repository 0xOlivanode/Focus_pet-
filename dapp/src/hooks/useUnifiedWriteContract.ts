"use client";

import { useWriteContract } from "wagmi";
import { createWalletClient, createPublicClient, custom, http, erc20Abi, encodeFunctionData, type Abi } from "viem";
import { celo } from "wagmi/chains";
import { getWeb3AuthProvider } from "@/lib/web3AuthConnector";
import { useWeb3Auth } from "@web3auth/modal/react";
import { useState, useCallback, useRef } from "react";
import { IS_MINIPAY, nativeMiniPayEthereum } from "@/lib/miniPayEthereum";

// ── MiniPay fee-currency adapters ─────────────────────────────────────────────
// MiniPay does NOT default to the user's available stablecoin — it defaults to
// USDm. Users with only USDT or USDC will have every transaction fail silently
// unless we set feeCurrency explicitly (CIP-64, type 0x7b).
// Reference: builder-guide.md §Fee Abstraction, minipay-guide.md §Supported Stablecoins
const USDT_TOKEN    = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as const;
const USDT_FEE      = "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72" as const; // adapter
const USDC_TOKEN    = "0xcebA9300f2b948710d2653dD7B07f33A8B32118C" as const;
const USDC_FEE      = "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" as const; // adapter
const USDM_FEE      = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const; // token == adapter

// Detect the best feeCurrency for the user: USDT > USDC > USDm (fallback).
// Uses HTTP RPC so it doesn't go through the MiniPay WebView.
const ALCHEMY_RPC = "https://celo-mainnet.g.alchemy.com/v2/YcblzW7m_-ItUCMj1Mu17";

async function detectMiniPayFeeCurrency(account: `0x${string}`): Promise<`0x${string}`> {
  try {
    const client = createPublicClient({
      chain: celo,
      transport: http(ALCHEMY_RPC),
    });
    const [usdtBal, usdcBal] = await Promise.all([
      client.readContract({ address: USDT_TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [account] }),
      client.readContract({ address: USDC_TOKEN, abi: erc20Abi, functionName: "balanceOf", args: [account] }),
    ]);
    if (usdtBal > 0n) return USDT_FEE;
    if (usdcBal > 0n) return USDC_FEE;
  } catch {
    // fall through to USDm default
  }
  return USDM_FEE;
}

type WriteContractParams = {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  gas?: bigint;
  value?: bigint;
  feeCurrency?: `0x${string}`;
};

export function useUnifiedWriteContract() {
  const {
    writeContractAsync: wagmiWriteAsync,
    isPending: wagmiIsPending,
    data: wagmiHash,
    error: wagmiError,
    reset: wagmiReset,
  } = useWriteContract();

  const { provider: liveWeb3AuthProvider, isConnected: web3authIsConnected } = useWeb3Auth();
  const liveProviderRef = useRef(liveWeb3AuthProvider);
  liveProviderRef.current = liveWeb3AuthProvider;

  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const writeContractAsync = useCallback(
    async (params: WriteContractParams): Promise<`0x${string}`> => {
      setError(null);

      const w3aProvider = IS_MINIPAY
        ? null
        : ((web3authIsConnected ? (liveProviderRef.current as any) : null) ??
            getWeb3AuthProvider());

      if (IS_MINIPAY && nativeMiniPayEthereum) {
        // ── MiniPay ──────────────────────────────────────────────────────────
        // Uses CIP-64 (feeCurrency) — NOT type:"legacy".
        //
        // "MiniPay Only Supports Legacy Transactions" means: don't use EIP-1559
        // fields (maxFeePerGas / maxPriorityFeePerGas). CIP-64 (type 0x7b) IS
        // supported and is the correct way to do fee abstraction in MiniPay.
        //
        // MiniPay defaults to USDm for gas. Users with only USDT/USDC have no
        // USDm, so their transactions fail silently without an explicit feeCurrency.
        // We detect the best available stablecoin and set feeCurrency accordingly.
        // viem automatically formats as CIP-64 when feeCurrency is present.
        //
        // gas forwarded when provided — skips eth_estimateGas.
        if (!nativeMiniPayEthereum) throw new Error("MiniPay provider not found");
        setIsPending(true);
        try {
          const accounts = await (nativeMiniPayEthereum as any).request({
            method: "eth_requestAccounts",
          }) as string[];
          const account = accounts[0] as `0x${string}`;
          if (!account) throw new Error("MiniPay not connected — reload and try again");

          // No `chain` here — MiniPay's provider owns the chain. Passing chain:celo
          // causes viem to validate the wallet's reported chain ID against 42220,
          // which fails in testnet/developer mode (11142220) and on any chain mismatch.
          const walletClient = createWalletClient({
            transport: custom(nativeMiniPayEthereum as any),
          });

          const feeCurrency = params.feeCurrency ?? await detectMiniPayFeeCurrency(account);

          // Encode calldata manually and use sendTransaction — the canonical
          // MiniPay pattern. walletClient.writeContract runs prepareTransactionRequest
          // which calls eth_estimateGas through MiniPay's provider; that pre-flight
          // fails on deployed (but not ngrok) causing silent tx rejections.
          // sendTransaction skips all pre-flight and goes straight to eth_sendTransaction.
          const data = encodeFunctionData({
            abi: params.abi as Abi,
            functionName: params.functionName,
            args: (params.args ?? []) as unknown[],
          });

          // 90-second timeout — prevents isSigning from locking the UI forever
          // if MiniPay's WebView hangs on eth_gasPrice / eth_sendTransaction.
          const txHash = await Promise.race([
            walletClient.sendTransaction({
              account,
              to: params.address,
              data,
              gas: params.gas,
              value: params.value,
              feeCurrency,
            } as any),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("MiniPay request timed out — please try again")), 90_000)
            ),
          ]);

          setHash(txHash);
          return txHash;
        } catch (err) {
          const e = err instanceof Error ? err : new Error(String(err));
          setError(e);
          throw e;
        } finally {
          setIsPending(false);
        }

      } else if (w3aProvider) {
        // ── Web3Auth ─────────────────────────────────────────────────────────
        setIsPending(true);
        try {
          const walletClient = createWalletClient({
            chain: celo,
            transport: custom(w3aProvider),
          });
          const [account] = await walletClient.getAddresses();
          const txHash = await walletClient.writeContract({
            ...(params as Parameters<typeof walletClient.writeContract>[0]),
            account,
            chain: celo,
          });
          setHash(txHash);
          return txHash;
        } catch (err) {
          const e = err instanceof Error ? err : new Error(String(err));
          setError(e);
          throw e;
        } finally {
          setIsPending(false);
        }

      } else {
        // ── Privy ─────────────────────────────────────────────────────────────
        setIsPending(true);
        try {
          const txHash = await wagmiWriteAsync(params as Parameters<typeof wagmiWriteAsync>[0]);
          setHash(txHash);
          return txHash;
        } catch (err) {
          const e = err instanceof Error ? err : new Error(String(err));
          setError(e);
          throw e;
        } finally {
          setIsPending(false);
        }
      }
    },
    [wagmiWriteAsync, web3authIsConnected],
  );

  const writeContract = useCallback(
    (params: WriteContractParams) => {
      writeContractAsync(params).catch(() => {});
    },
    [writeContractAsync],
  );

  const reset = useCallback(() => {
    setHash(undefined);
    setError(null);
    wagmiReset();
  }, [wagmiReset]);

  return {
    writeContract,
    writeContractAsync,
    data: hash ?? wagmiHash,
    isPending: isPending || wagmiIsPending,
    error: error ?? (wagmiError as Error | null),
    reset,
  };
}
