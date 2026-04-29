"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useDisconnect } from "wagmi";
import { useWeb3Auth, useWeb3AuthDisconnect } from "@web3auth/modal/react";

export function useAuth() {
  const { authenticated, ready: privyReady, logout: privyLogout } = usePrivy();
  const { isConnected: wagmiConnected, address: wagmiAddress } = useAccount();
  const { disconnect } = useDisconnect();

  // Use isConnected (stable boolean) rather than status string to avoid issues
  // during transitional states when the SDK asynchronously updates after OTP.
  // isInitialized becomes true once Web3Auth's init() completes (connected OR not).
  // We need it to delay "isReady" so we never flash the welcome screen for returning
  // users while Web3Auth is still restoring its session from storage.
  const { isConnected: web3authIsConnected, isInitialized: web3authIsInitialized, provider: web3authProvider } = useWeb3Auth();
  const { disconnect: web3authDisconnect } = useWeb3AuthDisconnect();

  const isMiniPay =
    typeof window !== "undefined" && !!(window.ethereum as any)?.isMiniPay;

  // Derive address directly from the Web3Auth EIP1193 provider. This is available
  // as soon as Web3Auth connects, before Web3AuthWagmiSync bridges into wagmi.
  const [web3authAddress, setWeb3authAddress] = useState<`0x${string}` | undefined>();

  useEffect(() => {
    if (!web3authIsConnected || !web3authProvider) {
      setWeb3authAddress(undefined);
      return;
    }
    (web3authProvider as any)
      .request({ method: "eth_accounts" })
      .then((accounts: string[]) => {
        setWeb3authAddress(accounts?.[0] as `0x${string}` | undefined);
      })
      .catch(() => setWeb3authAddress(undefined));
  }, [web3authIsConnected, web3authProvider]);

  // Prefer wagmi address (populated once Web3AuthWagmiSync connects wagmi).
  // Fall back to the address from the Web3Auth provider while wagmi is still syncing.
  const address = wagmiAddress ?? web3authAddress;

  // isReady = all providers that could hold a session have finished deciding.
  // Requiring web3authIsInitialized prevents showing AppWelcome while Web3Auth is
  // still in the middle of restoring a stored session (which takes 500-1500 ms).
  // The wagmiConnected short-circuit handles MiniPay and page refreshes where wagmi
  // reconnects before both SDKs fully initialize.
  const isReady = (privyReady && web3authIsInitialized) || web3authIsConnected || wagmiConnected;
  const isAuthenticated = authenticated || web3authIsConnected || wagmiConnected;

  const authType: "privy" | "web3auth" | "minipay" | null = authenticated
    ? "privy"
    : web3authIsConnected
      ? "web3auth"
      : wagmiConnected && isMiniPay
        ? "minipay"
        : wagmiConnected
          ? "minipay"
          : null;

  const logout = async () => {
    if (authenticated) {
      await privyLogout();
    } else if (web3authIsConnected) {
      await web3authDisconnect();
      disconnect();
    } else {
      disconnect();
    }
  };

  return {
    isAuthenticated,
    isReady,
    logout,
    authType,
    address,
    authenticated,
    privyReady,
  };
}
