"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Heart, Waves, RotateCcw, Zap } from "lucide-react";
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

const RANK_TIERS = [
  { min: 500, name: "Guardian of G$", color: "text-amber-500",  bg: "bg-amber-500/10  border-amber-500/20",  icon: "👑" },
  { min: 100, name: "Social Hero",    color: "text-indigo-500", bg: "bg-indigo-500/10 border-indigo-500/20", icon: "💎" },
  { min: 10,  name: "Impact Maker",   color: "text-emerald-500",bg: "bg-emerald-500/10 border-emerald-500/20",icon: "✨" },
  { min: 0,   name: "Focus Novice",   color: "text-neutral-400",bg: "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700", icon: "🌱" },
];

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

  React.useEffect(() => {
    if (!isStreaming || !flowRate || !lastUpdated) { setStreamedDonation(0); return; }
    const now = BigInt(Math.floor(Date.now() / 1000));
    const secondsPassed = now > lastUpdated ? now - lastUpdated : BigInt(0);
    const flowPerSec = parseFloat(formatEther(flowRate));
    setStreamedDonation(flowPerSec * Number(secondsPassed));
    const interval = setInterval(() => setStreamedDonation((p) => p + flowPerSec), 1000);
    return () => clearInterval(interval);
  }, [isStreaming, flowRate, lastUpdated]);

  const donatedAmt   = parseFloat(formatEther(totalDonated));
  const donatedLabel = donatedAmt.toFixed(2);
  const globalLabel  = globalUbiBalance
    ? parseFloat(formatEther(globalUbiBalance)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";

  const monthlyAmount = isStreaming && flowRate
    ? Number(formatEther(flowRate * BigInt(30 * 24 * 60 * 60))) : 0;
  const xpMultiplier = monthlyAmount >= 90 ? "1.7×" : monthlyAmount >= 45 ? "1.4×" : monthlyAmount >= 9 ? "1.2×" : null;

  const rank = RANK_TIERS.find((t) => donatedAmt >= t.min) ?? RANK_TIERS[RANK_TIERS.length - 1];

  return (
    <div className="w-full mt-8 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
            <Globe size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-black text-base text-neutral-900 dark:text-white leading-tight">
              Social Impact
            </h3>
            <p className="text-[10px] text-neutral-400 font-medium">
              Your focus helps fund global UBI
            </p>
          </div>
        </div>

        {/* Rank badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${rank.bg} ${rank.color}`}>
          <span>{rank.icon}</span>
          <span>{rank.name}</span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-neutral-100 dark:bg-neutral-800 mx-6" />

      {/* Stats row */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {/* Your contribution */}
        <div className="rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-700/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-emerald-500">
              <Heart size={12} fill="currentColor" />
              <span className="text-[9px] font-black uppercase tracking-widest opacity-70">
                Your Total
              </span>
            </div>
            {isStreaming && onSync && (
              <button
                onClick={(e) => { e.stopPropagation(); onSync(); }}
                disabled={isSyncing}
                title="Sync to blockchain"
                className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
              >
                <RotateCcw size={10} className={isSyncing ? "animate-spin" : ""} />
              </button>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter">
              {donatedLabel}
            </span>
            <span className="text-xs font-bold text-emerald-500">G$</span>
          </div>
          {isStreaming && (
            <div className="mt-1.5 flex items-center gap-1 text-emerald-500/80">
              <Waves size={9} className="animate-pulse" />
              <span className="text-[9px] font-bold">+{streamedDonation.toFixed(4)} live</span>
            </div>
          )}
        </div>

        {/* Community total */}
        <div className="rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 p-4 relative overflow-hidden">
          <div className="absolute -bottom-3 -right-3 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-1.5 text-emerald-500 mb-3">
            <Globe size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest opacity-70">
              Community
            </span>
          </div>
          <div className="flex items-baseline gap-1 relative z-10">
            <span className="text-2xl font-black text-neutral-900 dark:text-white tracking-tighter">
              {globalLabel}
            </span>
            <span className="text-xs font-bold text-emerald-500">G$</span>
          </div>
          <p className="text-[9px] text-neutral-400 font-medium mt-1 leading-tight">
            from all FocusPet users
          </p>
        </div>
      </div>

      {/* Active stream banner */}
      <AnimatePresence>
        {isStreaming && xpMultiplier && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mb-4 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <Waves size={13} className="text-cyan-500" />
                <span className="text-[11px] font-black text-cyan-600 dark:text-cyan-400">
                  Stream active — G$ flowing to UBI pool
                </span>
              </div>
              <div className="flex items-center gap-1 bg-cyan-500/20 px-2 py-0.5 rounded-full">
                <Zap size={10} className="text-cyan-500" />
                <span className="text-[10px] font-black text-cyan-500">{xpMultiplier} XP</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer info */}
      <div className="px-4 pb-4">
        <div className="px-4 py-3 bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl border border-neutral-100 dark:border-neutral-700/40">
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium">
            FocusPet is built on{" "}
            <span className="font-black text-neutral-700 dark:text-neutral-300">GoodDollar</span>
            , a UBI protocol serving thousands globally. Every focus session and
            purchase streams value directly to the pool. 🌍✨
          </p>
        </div>
      </div>
    </div>
  );
}
