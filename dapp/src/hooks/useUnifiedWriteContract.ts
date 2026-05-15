"use client";

import { useWriteContract } from "wagmi";
import { createWalletClient, custom, type Abi } from "viem";
import { celo } from "wagmi/chains";
import { getWeb3AuthProvider } from "@/lib/web3AuthConnector";
import { useWeb3Auth } from "@web3auth/modal/react";
import { useState, useCallback, useRef } from "react";
import { useMiniPayContext } from "@/contexts/MiniPayContext";

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
 * MiniPay: viem direct with window.ethereum and type:'legacy'.
 *   MiniPay only supports legacy (type 0) transactions — EIP-1559 (type 2) and
 *   CIP-64 are not accepted. Gas fee abstraction (stablecoin payment) is handled
 *   natively by MiniPay's provider; dApps must NOT set feeCurrency or explicit gas.
 *   Bypassing wagmi avoids any stale-connector or pending-nonce issues.
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

      } else {
        // ── MiniPay + Privy ───────────────────────────────────────────────────
        // MiniPay: type:'legacy' (only type 0 accepted) + no explicit gas so
        //   MiniPay estimates it natively for stablecoin fee display.
        //   The wagmi transport's slot 0 routes all RPC calls (including
        //   eth_estimateGas) through window.ethereum, bypassing the HTTP RPCs
        //   that MiniPay's sandbox blocks.
        // Privy: no overrides needed.
        const isMiniPayUser = isMiniPay === true;
        setIsPending(true);
        try {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { gas: _gas, ...restParams } = params;
          const txHash = await wagmiWriteAsync({
            ...(isMiniPayUser
              ? (restParams as Parameters<typeof wagmiWriteAsync>[0])
              : (params as Parameters<typeof wagmiWriteAsync>[0])),
            ...(isMiniPayUser ? { type: "legacy" as const } : {}),
          } as Parameters<typeof wagmiWriteAsync>[0]);
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
