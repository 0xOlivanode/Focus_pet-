"use client";

import { useWriteContract } from "wagmi";
import { createWalletClient, custom, encodeFunctionData, type Abi } from "viem";
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
  feeCurrency?: `0x${string}`;
};

/**
 * Drop-in replacement for wagmi's useWriteContract that works for all auth types.
 *
 * Priority order: MiniPay → Web3Auth → Privy
 * IS_MINIPAY and nativeMiniPayEthereum are captured at module-load time (before
 * Privy/Web3Auth can override window.ethereum) so MiniPay detection is immune
 * to provider injection that happens during React initialisation.
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

      // IS_MINIPAY is captured at module-load time before Privy can override
      // window.ethereum — safe to use here even if Privy has since injected.
      const w3aProvider = IS_MINIPAY
        ? null
        : ((web3authIsConnected ? (liveProviderRef.current as any) : null) ??
            getWeb3AuthProvider());

      if (IS_MINIPAY) {
        // ── MiniPay ──────────────────────────────────────────────────────────
        // Pattern from MiniPay docs / celopedia skill:
        //   1. createWalletClient with custom(window.ethereum)
        //   2. encodeFunctionData manually — skips writeContract()'s eth_call simulation
        //   3. walletClient.sendTransaction() with type:"legacy" and explicit gas
        //
        // type:"legacy" — MiniPay only handles legacy (non-EIP-1559) transactions.
        //   Without it, viem may attempt eth_maxFeePerGas / eth_feeHistory calls that hang.
        // gas — callers always supply an explicit gas limit. Without it, viem calls
        //   eth_estimateGas before every tx, which hangs in MiniPay's WebView.
        //   (This is what the working commit at 2792191 got right: gas + type:legacy.)
        if (!nativeMiniPayEthereum) throw new Error("MiniPay provider not found");
        setIsPending(true);
        try {
          const walletClient = createWalletClient({
            chain: celo,
            transport: custom(nativeMiniPayEthereum),
          });

          const [account] = await walletClient.getAddresses();
          if (!account) throw new Error("MiniPay not connected — try reloading");

          const data = encodeFunctionData({
            abi: params.abi as Abi,
            functionName: params.functionName,
            args: params.args,
          });

          const txHash = await walletClient.sendTransaction({
            account,
            to: params.address,
            data,
            type: "legacy",
            ...(params.gas !== undefined && { gas: params.gas }),
            ...(params.value !== undefined && { value: params.value }),
            ...(params.feeCurrency !== undefined && { feeCurrency: params.feeCurrency }),
          } as Parameters<typeof walletClient.sendTransaction>[0]);

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
