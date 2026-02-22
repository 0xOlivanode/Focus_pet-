"use client";

import React from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Info,
} from "lucide-react";
import { formatEther } from "viem";

interface PetShopProps {
  gBalance: bigint | undefined;
  allowance: bigint;
  health: number;
  isPending: boolean;
  isSuccess: boolean;
  writeError: any;
  receiptError: any;
  onApprove: (amount: bigint) => void;
  onBuyFood: () => void;
  onRevive: () => void;
  playSound: (sound: any) => void;
}

export function PetShop({
  gBalance,
  allowance,
  health,
  isPending,
  isSuccess,
  writeError,
  receiptError,
  onApprove,
  onBuyFood,
  onRevive,
  playSound,
}: PetShopProps) {
  const balanceFormatted = gBalance
    ? parseFloat(formatEther(gBalance)).toFixed(2)
    : "0.00";

  return (
    <div className="relative w-full mt-12 overflow-hidden rounded-[3.5rem] border border-white/20 dark:border-white/10 bg-white/30 dark:bg-black/40 backdrop-blur-3xl p-6 md:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]">
      {/* Dynamic Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            x: [0, 20, 0],
            y: [0, -20, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-indigo-500/30 blur-[120px] rounded-full"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -30, 0],
            y: [0, 30, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-pink-500/30 blur-[120px] rounded-full"
        />
      </div>

      {/* Header Section */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div className="flex-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4 mb-3"
          >
            <div className="p-3.5 bg-indigo-600 rounded-[1.5rem] shadow-2xl shadow-indigo-600/40 transform -rotate-6">
              <ShoppingBag className="text-white" size={24} />
            </div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-neutral-900 dark:text-white">
              Pet Shop
            </h2>
          </motion.div>
          <p className="text-sm md:text-base font-medium text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
            Boost your companion's stats with high-fidelity mechanical treats.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/80 dark:bg-neutral-800/60 backdrop-blur-xl border border-white/50 dark:border-white/10 rounded-[2.5rem] p-5 flex items-center gap-6 shadow-xl"
        >
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-neutral-400 dark:text-neutral-500 mb-1">
              G$ Balance
            </span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-mono font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                {balanceFormatted}
              </span>
              <span className="text-xs font-black text-neutral-400 dark:text-neutral-500">
                G$
              </span>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-[1.25rem] bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30"
          >
            <TrendingUp size={22} />
          </motion.button>
        </motion.div>
      </div>

      {/* Main Shop Items */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Enable Shopping (Visible if no allowance) */}
        {allowance === BigInt(0) && (
          <div className="col-span-1 md:col-span-2">
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                onApprove(
                  BigInt(
                    "115792089237316195423570985008687907853269984665640564039457584007913129639935",
                  ),
                );
                playSound("click");
              }}
              className="w-full relative overflow-hidden group py-7 px-10 rounded-[3rem] bg-indigo-600 text-white flex flex-col items-center gap-2 shadow-2xl shadow-indigo-600/30 transition-all border border-indigo-500/50"
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="flex items-center gap-4 font-black text-xl">
                Enable Premium Shopping
                <ChevronRight className="group-hover:translate-x-2 transition-transform" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.3em] font-black opacity-70">
                Unlock all mechanical upgrades
              </span>
            </motion.button>
          </div>
        )}

        {/* Item 1: Apple Treats */}
        <motion.button
          disabled={isPending || allowance === BigInt(0)}
          whileHover={
            !isPending && allowance !== BigInt(0) ? { scale: 1.03, y: -8 } : {}
          }
          whileTap={
            !isPending && allowance !== BigInt(0) ? { scale: 0.97 } : {}
          }
          onClick={() => {
            onBuyFood();
            playSound("buy");
          }}
          className={`relative group p-8 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-6 ${
            isPending || allowance === BigInt(0)
              ? "bg-neutral-200/20 dark:bg-neutral-900/40 border-transparent opacity-40 grayscale cursor-not-allowed"
              : "bg-white/70 dark:bg-neutral-800/50 border-white/50 dark:border-white/5 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-neutral-800 shadow-xl hover:shadow-[0_24px_48px_-12px_rgba(79,70,229,0.15)]"
          }`}
        >
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 bg-red-500/30 blur-[40px] rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="relative z-10"
            >
              <Image
                src="/assets/shop/apple.png"
                alt="Cyber Apple"
                width={128}
                height={128}
                className="drop-shadow-[0_10px_20px_rgba(239,68,68,0.4)]"
              />
            </motion.div>
            <div className="absolute -top-2 -right-2">
              <Sparkles
                className="text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity animate-pulse duration-500"
                size={24}
              />
            </div>
          </div>
          <div className="text-center w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="font-black text-lg text-neutral-800 dark:text-white">
                Cyber Apple
              </h3>
              <Info size={14} className="text-neutral-400" />
            </div>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-xs font-black tracking-widest uppercase border border-indigo-100/50 dark:border-indigo-500/30 shadow-sm">
              <span className="text-sm">10</span> G$
            </div>
          </div>
        </motion.button>

        {/* Item 2: Wake Up / Revive */}
        <motion.button
          disabled={health > 0 || isPending || allowance === BigInt(0)}
          whileHover={
            health === 0 && !isPending && allowance !== BigInt(0)
              ? { scale: 1.03, y: -8 }
              : {}
          }
          whileTap={
            health === 0 && !isPending && allowance !== BigInt(0)
              ? { scale: 0.97 }
              : {}
          }
          onClick={() => {
            onRevive();
            playSound("buy");
          }}
          className={`relative group p-8 rounded-[3rem] border-2 transition-all flex flex-col items-center gap-6 ${
            health > 0 || isPending || allowance === BigInt(0)
              ? "bg-neutral-200/20 dark:bg-neutral-900/40 border-transparent opacity-40 grayscale cursor-not-allowed"
              : "bg-white/70 dark:bg-neutral-800/50 border-white/50 dark:border-white/5 hover:border-indigo-500/50 hover:bg-white dark:hover:bg-neutral-800 shadow-xl hover:shadow-[0_24px_48px_-12px_rgba(79,70,229,0.15)]"
          }`}
        >
          <div className="relative w-32 h-32 flex items-center justify-center">
            <div className="absolute inset-0 bg-indigo-500/30 blur-[40px] rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
              className="relative z-10"
            >
              <Image
                src="/assets/shop/potion.png"
                alt="Electric Potion"
                width={128}
                height={128}
                className="drop-shadow-[0_10px_20px_rgba(99,102,241,0.4)]"
              />
            </motion.div>
            {health > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/40 dark:bg-black/40 backdrop-blur-md rounded-full z-20 overflow-hidden transform rotate-[-15deg]">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 dark:text-neutral-300">
                  FULLY CHARGED
                </span>
              </div>
            )}
          </div>
          <div className="text-center w-full">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="font-black text-lg text-neutral-800 dark:text-white">
                Eco Potion
              </h3>
              <div className="inline-flex items-center justify-center p-0.5 bg-neutral-200 dark:bg-neutral-700 rounded-full h-4 w-4">
                <Info size={10} className="text-neutral-500" />
              </div>
            </div>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 text-xs font-black tracking-widest uppercase border border-indigo-100/50 dark:border-indigo-500/30 shadow-sm">
              <span className="text-sm">50</span> G$
            </div>
          </div>
        </motion.button>
      </div>

      {/* Transaction Notifications */}
      <AnimatePresence>
        {(isPending || isSuccess || writeError || receiptError) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-10 z-20 relative"
          >
            {isPending && (
              <div className="flex items-center gap-4 p-5 rounded-[2rem] bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40">
                <Loader2 className="animate-spin" size={24} />
                <span className="text-sm font-black tracking-[0.1em] uppercase">
                  Mining Transaction On-Chain...
                </span>
              </div>
            )}

            {(writeError || receiptError) && (
              <div className="flex items-start gap-4 p-6 rounded-[2rem] bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 shadow-xl">
                <AlertCircle className="shrink-0 mt-0.5" size={24} />
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-black uppercase tracking-[0.2em]">
                    Transmission Error
                  </span>
                  <p className="text-sm font-medium leading-relaxed opacity-90">
                    {writeError?.message?.includes("user rejected")
                      ? "User rejected request"
                      : "The celestial gates are busy. Check your network."}
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
