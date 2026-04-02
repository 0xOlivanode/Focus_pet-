"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useAccount } from "wagmi";
import { LogOut, Copy, ChevronDown } from "lucide-react";
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
        className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-4 sm:py-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-full font-bold text-xs sm:text-sm hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors shadow-sm"
        title="Manage Account"
      >
        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-linear-to-r from-indigo-500 to-purple-500 shadow-sm shrink-0" />
        <span className="shrink-0">
          {address 
            ? `${address.slice(0, 4)}...${address.slice(-3)}` 
            : "Connected"}
        </span>
        <ChevronDown size={16} className="ml-0.5 opacity-50 hidden sm:block" />
      </button>
    );
  }

  return (
    <button
      onClick={login}
      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm transition-colors shadow-sm active:scale-95"
    >
      Start Your Journey
    </button>
  );
}
