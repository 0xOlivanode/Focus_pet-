"use client";

import { useWriteContract, useSendTransaction } from "wagmi";
import { createWalletClient, custom, encodeFunctionData, type Abi } from "viem";
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
 * Web3Auth: viem direct with the Web3Auth EIP1193 provider.
 *
 * MiniPay: wagmi's useSendTransaction + encodeFunctionData — exactly the pattern
 *   the MiniPay docs recommend. sendTransaction goes through the wagmi injected
 *   connector, which correctly forwards feeCurrency to MiniPay's provider without
 *   the stripping that happens inside writeContract. No explicit gas — MiniPay
 *   estimates it so it can calculate the stablecoin fee amount.
 *
 * Privy: wagmi's writeContract (no feeCurrency needed).
 *
 * Returns the same shape as wagmi's useWriteContract:
 *   { writeContract, writeContractAsync, data, isPending, error, reset }
 */
export function useUnifiedWriteContract() {
  const {
    writeContractAsync: wagmiWriteAsync,
    isPending: wagmiWriteIsPending,
    data: wagmiWriteHash,
    error: wagmiWriteError,
    reset: wagmiWriteReset,
  } = useWriteContract();

  const {
    sendTransactionAsync: wagmiSendAsync,
    isPending: wagmiSendIsPending,
    data: wagmiSendHash,
    error: wagmiSendError,
    reset: wagmiSendReset,
  } = useSendTransaction();

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

      } else if (isMiniPay === true) {
        // ── MiniPay ──────────────────────────────────────────────────────────
        // Use wagmi's sendTransaction + encodeFunctionData — the exact pattern
        // from the MiniPay docs. sendTransaction goes through the wagmi injected
        // connector and correctly forwards feeCurrency to MiniPay's provider.
        // No explicit gas: MiniPay must estimate it to calculate the stablecoin fee.
        setIsPending(true);
        try {
          const data = encodeFunctionData({
            abi: params.abi as Abi,
            functionName: params.functionName,
            args: params.args as readonly unknown[],
          });
          const txHash = await wagmiSendAsync({
            to: params.address,
            data,
            ...(params.value !== undefined ? { value: params.value } : {}),
            feeCurrency: USDT_FEE_ADAPTER,
          } as Parameters<typeof wagmiSendAsync>[0]);
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
        // wagmi's writeContract handles it normally — no feeCurrency needed.
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
    [wagmiWriteAsync, wagmiSendAsync, web3authIsConnected, isMiniPay],
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
    wagmiWriteReset();
    wagmiSendReset();
  }, [wagmiWriteReset, wagmiSendReset]);

  return {
    writeContract,
    writeContractAsync,
    data: hash ?? wagmiWriteHash ?? wagmiSendHash,
    isPending: isPending || wagmiWriteIsPending || wagmiSendIsPending,
    error: error ?? (wagmiWriteError as Error | null) ?? (wagmiSendError as Error | null),
    reset,
  };
}
