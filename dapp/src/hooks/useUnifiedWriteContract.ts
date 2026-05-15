"use client";

import { useWriteContract } from "wagmi";
import { createWalletClient, custom, type Abi } from "viem";
import { celo } from "wagmi/chains";
import { getWeb3AuthProvider } from "@/lib/web3AuthConnector";
import { useWeb3Auth } from "@web3auth/modal/react";
import { useState, useCallback, useRef } from "react";
import { useMiniPayContext } from "@/contexts/MiniPayContext";

// USDm fee-currency address — same as token address for 18-decimal Mento stablecoins.
// MiniPay uses this as the default gas-fee token; setting it explicitly creates a
// CIP-64 transaction (Celo's fee-abstraction type) rather than an EIP-1559 transaction.
// Do NOT use the USDT/USDC token address here — those require separate adapter contracts.
const USDM_FEE_CURRENCY = "0x765DE816845861e75A25fCA122bb6898B8B1282a" as const;

type WriteContractParams = {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  gas?: bigint;
  value?: bigint;
};

/**
 * Drop-in replacement for wagmi's useWriteContract that works for all auth types.
 *
 * Web3Auth: viem direct with the Web3Auth EIP1193 provider.
 *
 * MiniPay: viem direct with window.ethereum + feeCurrency (CIP-64).
 *   requestAddresses() first (eth_requestAccounts) — eth_accounts returns [] until called.
 *   feeCurrency = USDm address creates a CIP-64 transaction (Celo fee abstraction).
 *   Do NOT use type:'legacy' — without feeCurrency viem defaults to EIP-1559 which MiniPay rejects.
 *   No explicit gas — MiniPay estimates natively for stablecoin fee display.
 *
 * Privy: standard wagmi writeContract (no overrides needed).
 *
 * Returns the same shape as wagmi's useWriteContract:
 *   { writeContract, writeContractAsync, data, isPending, error, reset }
 */
export function useUnifiedWriteContract() {
  const {
    writeContractAsync: wagmiWriteAsync,
    isPending: wagmiIsPending,
    data: wagmiHash,
    error: wagmiError,
    reset: wagmiReset,
  } = useWriteContract();

  const isMiniPay = useMiniPayContext();

  // Live provider from React context — always current even after tab resume.
  const { provider: liveWeb3AuthProvider, isConnected: web3authIsConnected } = useWeb3Auth();
  const liveProviderRef = useRef(liveWeb3AuthProvider);
  liveProviderRef.current = liveWeb3AuthProvider;

  const [hash, setHash] = useState<`0x${string}` | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const writeContractAsync = useCallback(
    async (params: WriteContractParams): Promise<`0x${string}`> => {
      setError(null);

      const w3aProvider =
        (web3authIsConnected ? (liveProviderRef.current as any) : null) ??
        getWeb3AuthProvider();

      if (w3aProvider) {
        // ── Web3Auth ─────────────────────────────────────────────────────────
        // Bypass wagmi entirely; sign with the Web3Auth EIP1193 provider.
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

      } else if (isMiniPay === true && typeof window !== "undefined" && (window.ethereum as any)?.isMiniPay) {
        // ── MiniPay ──────────────────────────────────────────────────────────
        // Use viem directly with window.ethereum — bypasses wagmi entirely.
        // MiniPay's sandbox blocks HTTP eth_estimateGas / eth_sendTransaction,
        // so all RPC calls must go through window.ethereum.
        //
        // feeCurrency creates a CIP-64 transaction (Celo fee abstraction).
        // Do NOT use type:'legacy' — without feeCurrency viem defaults to
        // EIP-1559 (type 2) which MiniPay rejects.
        //
        // requestAddresses() = eth_requestAccounts — required before any call
        // because eth_accounts returns [] until accounts are explicitly requested.
        setIsPending(true);
        try {
          const walletClient = createWalletClient({
            chain: celo,
            transport: custom(window.ethereum as Parameters<typeof custom>[0]),
          });
          const addresses = await walletClient.requestAddresses();
          const account = addresses[0];
          if (!account) {
            throw new Error(`MiniPay did not return an account (got: ${JSON.stringify(addresses)})`);
          }
          // Strip explicit gas — MiniPay must estimate natively for stablecoin fee display.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { gas: _gas, ...restParams } = params;
          const txHash = await walletClient.writeContract({
            ...(restParams as Parameters<typeof walletClient.writeContract>[0]),
            account,
            chain: celo,
            feeCurrency: USDM_FEE_CURRENCY,
          } as Parameters<typeof walletClient.writeContract>[0]);
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
    [wagmiWriteAsync, web3authIsConnected, isMiniPay],
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
