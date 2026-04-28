"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount, useDisconnect } from "wagmi";
import { useWeb3Auth, useWeb3AuthDisconnect } from "@web3auth/modal/react";

export function useAuth() {
  const { authenticated, ready: privyReady, logout: privyLogout } = usePrivy();
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();
  const { status: web3authStatus } = useWeb3Auth();
  const { disconnect: web3authDisconnect } = useWeb3AuthDisconnect();

  const isMiniPay =
    typeof window !== "undefined" && !!(window.ethereum as any)?.isMiniPay;

  const web3authConnected = web3authStatus === "connected";

  const isReady = privyReady || web3authConnected || isConnected;
  const isAuthenticated = authenticated || web3authConnected || isConnected;

  const authType: "privy" | "web3auth" | "minipay" | null = authenticated
    ? "privy"
    : web3authConnected
      ? "web3auth"
      : isConnected && isMiniPay
        ? "minipay"
        : isConnected
          ? "minipay"
          : null;

  const logout = async () => {
    if (authenticated) {
      await privyLogout();
    } else if (web3authConnected) {
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
