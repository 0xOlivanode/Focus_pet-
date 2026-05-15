"use client";

import { useWriteContract } from "wagmi";
import { createWalletClient, custom, type Abi } from "viem";
import { celo } from "wagmi/chains";
import { getWeb3AuthProvider } from "@/lib/web3AuthConnector";
import { useWeb3Auth } from "@web3auth/modal/react";
import { useState, useCallback, useRef } from "react";


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
 * MiniPay: wagmi writeContract with type:'legacy'.
 *   MiniPay's provider injects feeCurrency from the user's primary stablecoin automatically.
 *   Do NOT set feeCurrency — would break users who hold USDT vs USDm. The miniPayConnector
 *   routes all calls through window.ethereum, bypassing HTTP RPCs MiniPay's sandbox blocks.
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

      const isMiniPayEnv = typeof window !== "undefined" && (window.ethereum as any)?.isMiniPay === true;

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

      } else if (isMiniPayEnv) {
        // ── MiniPay ──────────────────────────────────────────────────────────
        // Viem-direct via window.ethereum — bypasses wagmi connector state entirely.
        // This is critical: wagmi may have a stale Web3Auth/Privy session cached in
        // localStorage, making isConnected:true for the wrong connector. Using
        // wagmiWriteAsync would route through that stale connector and fail.
        //
        // eth_requestAccounts MUST be called before eth_sendTransaction — MiniPay
        // rejects send calls without prior authorization even though it auto-injects.
        //
        // type:'legacy' → MiniPay injects feeCurrency from user's primary stablecoin.
        // Do NOT set feeCurrency — breaks users who hold USDT vs USDm.
        // gas passed through from params — skips eth_estimateGas (times out after
        // the phone is backgrounded during a long focus session).
        setIsPending(true);
        try {
          const accounts = await (window.ethereum as any).request({
            method: "eth_requestAccounts",
          });
          const account = (accounts[0] as `0x${string}`) ?? null;
          if (!account) throw new Error("MiniPay returned no address — try reloading the app");

          const walletClient = createWalletClient({
            chain: celo,
            transport: custom(window.ethereum as Parameters<typeof custom>[0]),
          });
          const txHash = await walletClient.writeContract({
            ...(params as Parameters<typeof walletClient.writeContract>[0]),
            account,
            chain: celo,
            type: "legacy",
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
