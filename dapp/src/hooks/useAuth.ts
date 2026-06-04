"use client";

import { useAccount, useDisconnect } from "wagmi";

export function useAuth() {
  const { isConnected, address } = useAccount();
  const { disconnect } = useDisconnect();

  return {
    isAuthenticated: isConnected,
    isReady: true,
    logout: disconnect,
    authType: isConnected ? ("minipay" as const) : null,
    address,
    authenticated: isConnected,
    privyReady: true,
  };
}
