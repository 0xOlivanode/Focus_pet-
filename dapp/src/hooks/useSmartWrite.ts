"use client";

import { useState, useCallback } from "react";
import { useWriteContract, useAccount } from "wagmi";
import { useSmartWallets } from "@privy-io/react-auth/smart-wallets";
import { useWallets } from "@privy-io/react-auth";
import { encodeFunctionData, type Abi } from "viem";

type WriteParams = {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: unknown[];
  gas?: bigint;
  value?: bigint;
};

type Callbacks = {
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (err: Error) => void;
  onSettled?: () => void;
};

/**
 * Drop-in replacement for wagmi's useWriteContract.
 *
 * - Embedded wallet users (email / social login): routes through the Privy
 *   smart wallet client so the Pimlico paymaster covers gas — zero CELO needed.
 * - External wallet users (MetaMask, hardware, WalletConnect): falls back to
 *   normal wagmi writeContract, paying gas from the wallet as usual.
 *
 * Returns the same shape as useWriteContract so callers need minimal changes.
 */
export function useSmartWrite() {
  const { address } = useAccount();
  const { wallets } = useWallets();
  const { client: smartClient } = useSmartWallets();
  const { writeContractAsync: wagmiWriteAsync } = useWriteContract();

  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // True when the currently connected wallet is a Privy embedded wallet
  const isEmbedded = wallets.some(
    (w) =>
      w.address.toLowerCase() === address?.toLowerCase() &&
      w.walletClientType === "privy"
  );

  const _send = useCallback(
    async (params: WriteParams): Promise<`0x${string}`> => {
      if (isEmbedded && smartClient) {
        // Encode calldata and send as a UserOperation through the bundler.
        // The paymaster configured in the Privy dashboard covers the gas fee.
        const data = encodeFunctionData({
          abi: params.abi as Abi,
          functionName: params.functionName,
          args: params.args ?? [],
        });
        return smartClient.sendTransaction({
          to: params.address,
          data,
          value: params.value ?? BigInt(0),
        });
      }
      // External wallet: regular EOA transaction through wagmi
      return wagmiWriteAsync(params as any);
    },
    [isEmbedded, smartClient, wagmiWriteAsync]
  );

  /** Fire-and-forget style — mirrors wagmi's writeContract(params, callbacks) */
  const writeContract = useCallback(
    (params: WriteParams, callbacks?: Callbacks) => {
      setError(null);
      setIsPending(true);
      setHash(undefined);

      _send(params)
        .then((txHash) => {
          setHash(txHash);
          callbacks?.onSuccess?.(txHash);
        })
        .catch((err: Error) => {
          setError(err);
          callbacks?.onError?.(err);
        })
        .finally(() => {
          setIsPending(false);
          callbacks?.onSettled?.();
        });
    },
    [_send]
  );

  /** Promise style — mirrors wagmi's writeContractAsync */
  const writeContractAsync = useCallback(
    async (params: WriteParams): Promise<`0x${string}`> => {
      setError(null);
      setIsPending(true);
      setHash(undefined);
      try {
        const txHash = await _send(params);
        setHash(txHash);
        return txHash;
      } catch (err: any) {
        setError(err);
        throw err;
      } finally {
        setIsPending(false);
      }
    },
    [_send]
  );

  return {
    writeContract,
    writeContractAsync,
    data: hash,        // matches useWriteContract's `data`
    isPending,         // matches useWriteContract's `isPending`
    error,             // matches useWriteContract's `error`
    isEmbedded,        // useful for UI decisions (e.g. hide Send CELO)
  };
}
