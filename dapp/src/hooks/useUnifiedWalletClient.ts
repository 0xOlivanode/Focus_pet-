"use client";
import { useWalletClient } from "wagmi";

export function useUnifiedWalletClient() {
  const { data: walletClient } = useWalletClient();
  return walletClient ?? null;
}
