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
 * Web3Auth users: @privy-io/wagmi's WagmiProvider doesn't allow external connectors
 * to sign txs, so we bypass wagmi entirely and use viem directly with the Web3Auth
 * EIP1193 provider. MiniPay and Privy users go through wagmi as normal.
 *
 * MiniPay users: feeCurrency is set to the USDT adapter so gas is paid in USDT
 * instead of native CELO (which MiniPay users typically don't hold).
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

      if (w3aProvider) {
        // Web3Auth user — viem direct, no wagmi connector needed
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
        // Privy / MiniPay — wagmi handles it normally
        setIsPending(true);
        try {
          const txHash = await wagmiWriteAsync({
            ...(params as Parameters<typeof wagmiWriteAsync>[0]),
            // MiniPay users pay gas in USDT via the adapter — no native CELO needed
            ...(isMiniPay === true ? { feeCurrency: USDT_FEE_ADAPTER } : {}),
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
