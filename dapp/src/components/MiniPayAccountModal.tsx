"use client";

import {
  useAccount,
  useBalance,
} from "wagmi";
import { X, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { miniPayGetExchangeRate } from "@/hooks/useMiniPay";

const USDT_ADDRESS = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";

interface MiniPayAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniPayAccountModal({ isOpen, onClose }: MiniPayAccountModalProps) {
  const { address } = useAccount();

  const { data: usdtBalance } = useBalance({
    address,
    token: USDT_ADDRESS as `0x${string}`,
  });

  const [localRate, setLocalRate] = useState<number | null>(null);
  const [localCurrency, setLocalCurrency] = useState("USD");
  useEffect(() => {
    if (!isOpen) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const currency = tz.startsWith("Africa/Lagos") ? "NGN" : "USD";
    setLocalCurrency(currency);
    if (currency !== "USD") {
      miniPayGetExchangeRate("USDT", currency).then((r) => {
        if (r) setLocalRate(r);
      });
    }
  }, [isOpen]);

  const usdtFormatted = usdtBalance
    ? parseFloat(usdtBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "—";

  const usdtLocalValue =
    usdtBalance && localRate && localCurrency !== "USD"
      ? (parseFloat(usdtBalance.formatted) * localRate).toLocaleString(undefined, { maximumFractionDigits: 0 })
      : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#111111] border-t border-neutral-800 rounded-t-[32px] shadow-2xl overflow-hidden pb-safe"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <Image
                  src="/focus-egg.png"
                  width={28}
                  height={28}
                  alt="FocusPet"
                  className="rounded-full border border-neutral-800"
                />
                <span className="font-bold text-white">My Wallet</span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
              >
                <X size={18} className="text-neutral-400" />
              </button>
            </div>

            <div className="px-6 pb-10 space-y-3">
              {/* Wallet address — display only, no copy */}
              <div className="w-full flex items-center p-3 rounded-2xl border border-neutral-800 bg-[#1a1a1a]">
                <div>
                  <div className="text-xs text-neutral-500 uppercase tracking-widest mb-0.5">
                    Wallet Address
                  </div>
                  <div className="font-medium text-white font-mono text-sm">
                    {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "—"}
                  </div>
                </div>
              </div>

              {/* USDT balance card */}
              <div className="p-5 rounded-3xl border border-neutral-800 bg-neutral-800/30">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <span className="text-[9px] text-white font-black">$</span>
                  </div>
                  <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                    USDT
                  </span>
                </div>
                <div className="font-bold text-2xl text-white">
                  {usdtFormatted}
                </div>
                {usdtLocalValue && (
                  <div className="text-[10px] font-medium text-neutral-500 mt-0.5">
                    ≈ {localCurrency} {usdtLocalValue}
                  </div>
                )}
              </div>

              {/* Action */}
              <button
                onClick={() => { window.location.href = "https://link.minipay.xyz/add_cash"; }}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl border border-neutral-800 bg-[#1a1a1a] hover:bg-neutral-800 transition-all"
              >
                <div className="w-8 h-8 rounded-xl bg-neutral-800 flex items-center justify-center">
                  <Plus size={16} className="text-neutral-300" />
                </div>
                <span className="text-sm font-bold text-white">Add Cash</span>
              </button>

              <p className="text-center text-[10px] font-bold text-neutral-700 uppercase tracking-widest pt-1">
                Powered by MiniPay · Celo
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
