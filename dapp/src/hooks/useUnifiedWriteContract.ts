"use client";

import { useWriteContract } from "wagmi";
import { createWalletClient, custom, type Abi } from "viem";
import { celo } from "wagmi/chains";
import { getWeb3AuthProvider } from "@/lib/web3AuthConnector";
import { useWeb3Auth } from "@web3auth/modal/react";
import { useState, useCallback, useRef } from "react";
import { IS_MINIPAY, nativeMiniPayEthereum } from "@/lib/miniPayEthereum";

type WriteContractParams = {
  address: `0x${string}`;
  abi: Abi | readonly unknown[];
  functionName: string;
  args?: readonly unknown[];
  gas?: bigint;
  value?: bigint;
  feeCurrency?: `0x${string}`; // used by Web3Auth/Privy; stripped for MiniPay
};

export function useUnifiedWriteContract() {
  const {
    writeContractAsync: wagmiWriteAsync,
    isPending: wagmiIsPending,
    data: wagmiHash,
    error: wagmiError,
    reset: wagmiReset,
  } = useWriteContract();

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
        // Use nativeMiniPayEthereum directly — do NOT route through wagmi's
        // writeContractAsync, which requires a connected account in wagmi's
        // store and throws "MetaMask not connected" if the connector hasn't
        // fully registered yet after the provider-tree switch.
        //
        // 1. eth_requestAccounts — auto-authorizes in MiniPay (no popup),
        //    returns the address instantly, and ensures the provider is ready.
        //
        // 2. walletClient.writeContract with type:"legacy" —
        //    MiniPay only supports type-0 (legacy) transactions.
        //    feeCurrency is stripped: it requires CIP-64 (type 0x7b), which is
        //    incompatible with type:"legacy". MiniPay selects the fee token
        //    from the user's balance automatically.
        //
        // 3. gas forwarded when provided — skips eth_estimateGas.
        if (!nativeMiniPayEthereum) throw new Error("MiniPay provider not found");
        setIsPending(true);
        try {
          const accounts = await (nativeMiniPayEthereum as any).request({
            method: "eth_requestAccounts",
          }) as string[];
          const account = accounts[0] as `0x${string}`;
          if (!account) throw new Error("MiniPay not connected — reload and try again");

          const walletClient = createWalletClient({
            chain: celo,
            transport: custom(nativeMiniPayEthereum as any),
          });

          const { feeCurrency: _stripped, ...rest } = params as any;
          const txHash = await walletClient.writeContract({
            ...(rest as any),
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
