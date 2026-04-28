"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useDisconnect } from "wagmi";

/**
 * Unified auth hook that works for all three user types:
 *  - Privy users (existing, email/wallet via Privy)
 *  - Web3Auth users (new users, email/wallet via Web3Auth)
 *  - MiniPay users (injected wallet, no auth provider)
 */
export function useAuth() {
  const { authenticated, ready: privyReady, logout: privyLogout } = usePrivy();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  const isMiniPay =
    typeof window !== "undefined" && !!(window.ethereum as any)?.isMiniPay;

  // Privy is always "ready" quickly; wagmi resolves independently.
  // For routing purposes, privyReady is the signal we need.
  const isReady = privyReady;

  // Authenticated = Privy session OR active wagmi connection (Web3Auth / MiniPay)
  const isAuthenticated = authenticated || isConnected;

  const authType: "privy" | "web3auth" | "minipay" | null = authenticated
    ? "privy"
    : isConnected && isMiniPay
      ? "minipay"
      : isConnected
        ? "web3auth"
        : null;

  const logout = async () => {
    if (authenticated) {
      await privyLogout();
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
    // Keep these available for Privy-specific logic in components
    authenticated,
    privyReady,
  };
}
