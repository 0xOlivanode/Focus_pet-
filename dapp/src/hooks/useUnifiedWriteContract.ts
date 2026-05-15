"use client";

import { useWriteContract } from "wagmi";
import { createWalletClient, custom, type Abi } from "viem";
import { celo } from "wagmi/chains";
import { getWeb3AuthProvider } from "@/lib/web3AuthConnector";
import { useWeb3Auth } from "@web3auth/modal/react";
import { useState, useCallback, useRef } from "react";
import { useMiniPayContext } from "@/contexts/MiniPayContext";

// MiniPay users hold stablecoins, not native CELO.
// feeCurrency must be the adapter address (not the token address) for tokens that use one.
// USDT adapter: https://docs.celo.org/developer/celo-for-minipay
const USDT_FEE_ADAPTER = "0x0E2A3e05bc9A16F5292A6170456A710cb89C6f72" as const;

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
 * Web3Auth users: bypass wagmi and use viem directly with the Web3Auth EIP1193 provider.
 * MiniPay users: bypass wagmi and use viem directly with window.ethereum — this guarantees
 *   feeCurrency (USDT adapter) is serialized into the Celo transaction. wagmi strips
 *   non-standard fields before forwarding to viem, so feeCurrency never reached the
 *   provider when going through wagmi.
 * Privy users: wagmi handles it normally (no feeCurrency needed).
 *
 * Provider resolution order for Web3Auth:
 *   1. Live provider from useWeb3Auth() React context — always the freshest reference.
 *   2. Module-level cache from getWeb3AuthProvider() — fallback only.
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

      // MiniPay's window.ethereum when confirmed in MiniPay environment
      const miniPayProvider =
        isMiniPay === true && typeof window !== "undefined"
          ? (window.ethereum as any)
          : null;

      const viemProvider = w3aProvider ?? miniPayProvider;

      if (viemProvider) {
        // Web3Auth or MiniPay — use viem directly so feeCurrency is serialized correctly.
        // wagmi strips non-standard EIP-1559 fields before passing to viem, so feeCurrency
        // never reached MiniPay's provider when going through wagmiWriteAsync.
        setIsPending(true);
        try {
          const walletClient = createWalletClient({
            chain: celo,
            transport: custom(viemProvider),
          });
          const [account] = await walletClient.getAddresses();
          const txHash = await walletClient.writeContract({
            ...(params as Parameters<typeof walletClient.writeContract>[0]),
            account,
            chain: celo,
            // MiniPay: set feeCurrency (adapter) and clear explicit gas so the
            // provider can estimate naturally. An explicit gas limit interferes
            // with MiniPay's internal stablecoin fee calculation.
            ...(miniPayProvider
              ? { feeCurrency: USDT_FEE_ADAPTER, gas: undefined }
              : {}),
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
        // Privy — wagmi handles it normally
        setIsPending(true);
        try {
          const txHash = await wagmiWriteAsync(
            params as Parameters<typeof wagmiWriteAsync>[0],
          );
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
