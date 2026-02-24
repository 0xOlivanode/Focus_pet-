"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  Heart,
  TrendingUp,
  Award,
  Info,
  Waves,
  Sparkles,
  RotateCcw,
} from "lucide-react";
import { formatEther } from "viem";

interface ImpactDashboardProps {
  totalDonated: bigint;
  xp: number;
  isStreaming?: boolean;
  flowRate?: bigint;
  lastUpdated?: bigint;
  globalUbiBalance?: bigint;
  onSync?: () => void;
  isSyncing?: boolean;
}

export function ImpactDashboard({
  totalDonated,
  xp,
  isStreaming,
  flowRate,
  lastUpdated,
  globalUbiBalance,
  onSync,
  isSyncing,
}: ImpactDashboardProps) {
  const [streamedDonation, setStreamedDonation] = React.useState(0);

  // Initialize and Tick streamedDonation
  React.useEffect(() => {
    if (!isStreaming || !flowRate || !lastUpdated) {
      setStreamedDonation(0);
      return;
    }

    // Calculate initial value based on time passed since lastUpdated
    const now = BigInt(Math.floor(Date.now() / 1000));
    const secondsPassed = now > lastUpdated ? now - lastUpdated : BigInt(0);
    const flowPerSec = parseFloat(formatEther(flowRate));

    setStreamedDonation(flowPerSec * Number(secondsPassed));

    const interval = setInterval(() => {
      setStreamedDonation((prev) => prev + flowPerSec);
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming, flowRate, lastUpdated]);

  const donatedAmount = parseFloat(formatEther(totalDonated)).toFixed(2);
  const globalAmount = globalUbiBalance
    ? parseFloat(formatEther(globalUbiBalance)).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";
  const hoursContributed = (xp / 3600).toFixed(1);

  // Calculate XP Boost multiplier for display
  const monthlyAmount =
    isStreaming && flowRate
      ? Number(formatEther(flowRate * BigInt(30 * 24 * 60 * 60)))
      : 0;
  const xpMultiplier =
    monthlyAmount >= 90
      ? "1.7x"
      : monthlyAmount >= 45
        ? "1.4x"
        : monthlyAmount >= 9
          ? "1.2x"
          : "1.0x";

  // Rank logic based on donation
  const getRank = (amount: number) => {
    if (amount >= 500)
      return { name: "Guardian of G$", color: "text-amber-500", icon: "👑" };
    if (amount >= 100)
      return { name: "Social Hero", color: "text-indigo-500", icon: "💎" };
    if (amount >= 10)
      return { name: "Impact Maker", color: "text-emerald-500", icon: "✨" };
    return { name: "Focus Novice", color: "text-neutral-400", icon: "🌱" };
  };

  const rank = getRank(parseFloat(donatedAmount));

  return (
    <div className="w-full mt-8 overflow-hidden bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-[32px] shadow-sm p-8 relative group">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-64 h-64 bg-emerald-500/5 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex flex-col gap-8 relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl text-emerald-600 dark:text-emerald-400">
                <Globe size={22} className="animate-spin-slow" />
              </div>
              <h3 className="font-black text-2xl tracking-tight text-neutral-900 dark:text-white">
                Social Impact
              </h3>
            </div>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium max-w-sm leading-relaxed">
              Every focus session and item purchase powers the global GoodDollar
              UBI pool. Your productivity is helping others live better.
            </p>
          </div>

          <div className="bg-neutral-50 dark:bg-neutral-900 px-4 py-2 rounded-2xl border border-neutral-100 dark:border-neutral-800 flex items-center gap-2">
            <span className="text-lg">{rank.icon}</span>
            <span
              className={`text-[10px] font-black uppercase tracking-widest ${rank.color}`}
            >
              {rank.name}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Stat 1: Total Contributed */}
          <div className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 hover:scale-[1.02] transition-transform relative overflow-hidden group">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <Heart size={16} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                  Historic Contribution
                </span>
              </div>

              {isStreaming && onSync && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSync();
                  }}
                  disabled={isSyncing}
                  className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                  title="Sync live contribution to blockchain"
                >
                  <RotateCcw
                    size={12}
                    className={
                      isSyncing
                        ? "animate-spin"
                        : "hover:rotate-180 transition-transform duration-500"
                    }
                  />
                </button>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter">
                {donatedAmount}
              </span>
              <span className="text-xs font-bold text-emerald-500">G$</span>
            </div>
            {/* Real-time Drip Indicator */}
            {isStreaming && (
              <div className="mt-2 flex items-center gap-1.5 text-emerald-500/80">
                <Waves size={10} className="animate-pulse" />
                <span className="text-[10px] font-bold">
                  +{streamedDonation.toFixed(4)} G$ Live
                </span>
              </div>
            )}
          </div>

          {/* Stat 2: Supercharge Live Impact (Only visible when streaming) */}
          <AnimatePresence>
            {isStreaming && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="p-4 rounded-3xl bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-cyan-500">
                    🔴
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Live Stream
                    </span>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-500 text-[8px] font-black uppercase tracking-widest animate-pulse">
                    Active
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-x-2 items-center">
                    <span className="text-[10px] w-fit font-bold text-neutral-400 uppercase">
                      Current Stream
                    </span>
                    <span className="text-xs font-semibold text-emerald-500">
                      To UBI Pool
                    </span>
                  </div>
                  <div className="flex gap-x-2 items-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                      Live Boost
                    </span>
                    <span className="text-xs font-semibold text-indigo-500">
                      XP Multiplier
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-cyan-500/10">
                  <p className="text-[9px] text-neutral-500 font-medium leading-tight">
                    While active, your pet is at full health and earns XP
                    faster. 🌍✨
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stat 3: FocusPet Community Total */}
          <div className="p-6 rounded-3xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 hover:scale-[1.02] transition-transform relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-4 text-emerald-500">
              <Globe size={16} className="animate-spin-slow" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                FocusPet Community Total
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter">
                {globalAmount}
              </span>
              <span className="text-xs font-bold text-emerald-500">G$</span>
            </div>
            <p className="mt-2 text-[9px] text-neutral-500 font-medium leading-tight">
              Collective impact generated exclusively by FocusPet users.
            </p>
          </div>
        </div>

        {/* Impact Message */}
        <div className="flex flex-col gap-3 p-6 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-3xl">
          <div className="flex items-center gap-2">
            <Info size={16} className="text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              What is this?
            </span>
          </div>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-medium">
            FocusPet is built on **GoodDollar**, a protocol that provides
            Universal Basic Income (UBI) to thousands of people globally. When
            you focus or buy items, a portion of the value is streamed directly
            to this UBI pool, making your productivity a force for global good.
            🌍✨
          </p>
        </div>
      </div>
    </div>
  );
}
