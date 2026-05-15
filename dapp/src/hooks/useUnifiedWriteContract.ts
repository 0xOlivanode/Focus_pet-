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
 * Priority order: MiniPay → Web3Auth → Privy
 * MiniPay must be checked first — Web3Auth restores its session independently of
 * wagmi's localStorage, so w3aProvider can be non-null even inside MiniPay. If
 * Web3Auth is checked first, every MiniPay transaction routes through Web3Auth's
 * dead provider and times out.
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

      const isMiniPayEnv =
        typeof window !== "undefined" && (window.ethereum as any)?.isMiniPay === true;

      // Null out Web3Auth provider when in MiniPay so the Web3Auth branch is
      // never entered — Web3Auth can restore a cached session independently of
      // wagmi's localStorage wipe and would otherwise hijack MiniPay writes.
      const w3aProvider = isMiniPayEnv
        ? null
        : ((web3authIsConnected ? (liveProviderRef.current as any) : null) ??
            getWeb3AuthProvider());

      if (isMiniPayEnv) {
        // ── MiniPay ──────────────────────────────────────────────────────────
        // Viem-direct via window.ethereum — bypasses wagmi connector state entirely.
        // eth_requestAccounts must be called before eth_sendTransaction.
        // type:'legacy' → MiniPay injects feeCurrency from the user's primary
        //   stablecoin automatically. Do NOT set feeCurrency (breaks USDT users).
        // gas passthrough → skips eth_estimateGas (times out when the phone is
        //   backgrounded during a long focus session).
        setIsPending(true);
        try {
          const accounts: string[] = await (window.ethereum as any).request({
            method: "eth_requestAccounts",
          });
          const account = accounts[0] as `0x${string}`;
          if (!account) throw new Error("MiniPay returned no address — try reloading");

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

      } else if (w3aProvider) {
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
