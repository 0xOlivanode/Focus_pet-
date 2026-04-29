"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

interface PrivyConnectButtonProps {
  onOpenAccount?: () => void;
}

export function PrivyConnectButton({ onOpenAccount }: PrivyConnectButtonProps) {
  const { isAuthenticated, isReady, address } = useAuth();

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isReady) {
    return (
      <div className="w-24 h-10 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-full" />
    );
  }

  // MiniPay: wallet is injected automatically — Navbar handles this separately
  if ((window.ethereum as any)?.isMiniPay) {
    return null;
  }

  if (isAuthenticated) {
    return (
      <button
        onClick={onOpenAccount}
        className="flex items-center gap-2 px-6 py-3.5 bg-neutral-100 text-neutral-900 rounded-full font-mono text-xs hover:bg-white transition-colors"
        title="Manage Account"
      >
        {address
          ? `${address.slice(0, 6)}...${address.slice(-3)}`
          : "Connected"}
      </button>
    );
  }

  // Unauthenticated state — AppWelcome handles sign-in; this is a fallback
  return null;
}
