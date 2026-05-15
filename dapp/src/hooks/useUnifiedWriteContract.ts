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
 * MiniPay: viem direct with window.ethereum + type:'legacy'.
 *   MiniPay's provider handles fee abstraction internally — it intercepts the legacy
 *   transaction and injects feeCurrency from the user's primary stablecoin (USDT/USDm/USDC).
 *   Do NOT set feeCurrency yourself — you'd have to pick USDm or USDT and break users
 *   who hold the other token. Let MiniPay pick. Do NOT set type:'eip1559' either — MiniPay
 *   rejects EIP-1559 fields. No explicit gas — MiniPay estimates natively.
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

      const isMiniPayEnv = typeof window !== "undefined" && (window.ethereum as any)?.isMiniPay === true;
      console.log("[useUnifiedWriteContract] path", {
        w3aProvider: !!w3aProvider,
        isMiniPayEnv,
        isMiniPayCtx: isMiniPay,
        fn: params.functionName,
      });

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
        // Check window.ethereum.isMiniPay directly — do NOT rely on the React
        // context which may still be null when this is first called.
        //
        // All RPC calls go through window.ethereum (bypasses wagmi + HTTP RPCs
        // which MiniPay's sandbox blocks for eth_estimateGas / eth_sendTransaction).
        //
        // type:'legacy' → MiniPay's provider injects feeCurrency from the user's
        // primary stablecoin automatically. Do NOT set feeCurrency here — you'd
        // have to pick USDm or USDT and break users who hold the other one.
        //
        // getAddresses() (eth_accounts) works because MiniPay auto-connects.
        setIsPending(true);
        try {
          const walletClient = createWalletClient({
            chain: celo,
            transport: custom(window.ethereum as Parameters<typeof custom>[0]),
          });
          const [account] = await walletClient.getAddresses();
          if (!account) {
            throw new Error("MiniPay eth_accounts returned no address — try reloading the app");
          }
          // Strip explicit gas — MiniPay must estimate natively for stablecoin fee display.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { gas: _gas, ...restParams } = params;
          const txHash = await walletClient.writeContract({
            ...(restParams as Parameters<typeof walletClient.writeContract>[0]),
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
