"use client";

import { useWriteContract } from "wagmi";
import { createWalletClient, custom, type Abi } from "viem";
import { celo } from "wagmi/chains";
import { getWeb3AuthProvider } from "@/lib/web3AuthConnector";
import { useWeb3Auth } from "@web3auth/modal/react";
import { useState, useCallback, useRef } from "react";
import { IS_MINIPAY } from "@/lib/miniPayEthereum";

type WriteContractParams = {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  gas?: bigint;
  value?: bigint;
  feeCurrency?: `0x${string}`; // used by Web3Auth/Privy paths; stripped for MiniPay
};

/**
 * Drop-in replacement for wagmi's useWriteContract that works for all auth types.
 *
 * Priority order: MiniPay → Web3Auth → Privy
 * IS_MINIPAY is captured at module-load time (before Privy/Web3Auth can override
 * window.ethereum) so MiniPay detection is immune to provider injection.
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

      const w3aProvider = IS_MINIPAY
        ? null
        : ((web3authIsConnected ? (liveProviderRef.current as any) : null) ??
            getWeb3AuthProvider());

      if (IS_MINIPAY) {
        // ── MiniPay ──────────────────────────────────────────────────────────
        // Use wagmi's standard writeContract with type:"legacy" — exactly the
        // pattern Blokaz uses (see blokaz/src/hooks/useBlokzGame.ts).
        //
        // type:"legacy" — MiniPay only supports type-0 (legacy) transactions.
        //
        // feeCurrency is intentionally stripped — MiniPay handles fee
        // abstraction natively by picking from the user's stablecoin balance.
        // feeCurrency requires CIP-64 (type 0x7b). Sending both type:"legacy"
        // AND feeCurrency is a protocol contradiction that breaks the tx.
        //
        // gas is forwarded when provided by callers to skip eth_estimateGas.
        setIsPending(true);
        try {
          const { feeCurrency: _stripped, ...rest } = params as any;
          const txHash = await wagmiWriteAsync({
            ...rest,
            type: "legacy",
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
