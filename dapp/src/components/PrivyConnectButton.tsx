"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface PrivyConnectButtonProps {
  onOpenAccount?: () => void;
}

export function PrivyConnectButton({ onOpenAccount }: PrivyConnectButtonProps) {
  const { login, logout, authenticated, ready } = usePrivy();
  const { address } = useAccount();

  // Hydration safety
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !ready) {
    return (
      <div className="w-24 h-10 bg-neutral-100 dark:bg-neutral-800 animate-pulse rounded-full" />
    );
  }

  // Inside MiniPay the wallet is injected automatically — no connect UI needed
  if ((window.ethereum as any)?.isMiniPay) {
    return null;
  }

  if (authenticated) {
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

  return (
    <button
      onClick={login}
      className="px-4 py-2 bg-white hover:bg-neutral-100 text-black rounded-full font-bold text-sm transition-colors active:scale-95"
    >
      Sign In
    </button>
  );
}
