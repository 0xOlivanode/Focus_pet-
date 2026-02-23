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
} from "lucide-react";
import { formatEther } from "viem";

interface ImpactDashboardProps {
  totalDonated: bigint;
  xp: number;
  isStreaming?: boolean;
  flowRate?: bigint;
}

export function ImpactDashboard({
  totalDonated,
  xp,
  isStreaming,
  flowRate,
}: ImpactDashboardProps) {
  const [streamedDonation, setStreamedDonation] = React.useState(0);
  const [streamedEssence, setStreamedEssence] = React.useState(0);

  // Real-time ticking effect
  React.useEffect(() => {
    if (!isStreaming || !flowRate) {
      setStreamedDonation(0);
      setStreamedEssence(0);
      return;
    }

    const interval = setInterval(() => {
      // 70/30 Social-to-Soul split
      const totalPerSec = parseFloat(formatEther(flowRate));
      const socialPerSec = totalPerSec * 0.7;
      const essencePerSec = totalPerSec * 0.3;

      setStreamedDonation((prev) => prev + socialPerSec);
      setStreamedEssence((prev) => prev + essencePerSec);
    }, 1000);

    return () => clearInterval(interval);
  }, [isStreaming, flowRate]);

  const donatedAmount = parseFloat(formatEther(totalDonated)).toFixed(2);
  const hoursContributed = (xp / 60).toFixed(1);

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
              Every item you buy redirects 10% of the cost to the global UBI
              pool. Your productivity is helping others live better.
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stat 1: Total Contributed */}
          <div className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 hover:scale-[1.02] transition-transform relative overflow-hidden group">
            <div className="flex items-center gap-2 mb-4 text-emerald-500">
              <Heart size={16} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                G$ Contributed
              </span>
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
                  +{streamedDonation.toFixed(4)} live
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
                className="p-6 rounded-3xl bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 hover:scale-[1.02] transition-transform"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-cyan-500">
                    <Sparkles size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      Live Stream
                    </span>
                  </div>
                  <div className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-500 text-[8px] font-black uppercase tracking-widest animate-pulse">
                    Active
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                      Social (70%)
                    </span>
                    <span className="text-sm font-black text-emerald-500">
                      +{streamedDonation.toFixed(4)} G$
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase">
                      Soul (30%)
                    </span>
                    <span className="text-sm font-black text-indigo-500">
                      +{streamedEssence.toFixed(4)} G$
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-cyan-500/10">
                  <p className="text-[9px] text-neutral-500 font-medium leading-tight">
                    Streaming rewards are split between UBI and Pet Essence for
                    multipliers.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stat 3: Focus Hours Impact */}
          <div className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-2 mb-4 text-indigo-500">
              <TrendingUp size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                Efficiency
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter">
                {hoursContributed}
              </span>
              <span className="text-xs font-bold text-indigo-500">Hrs</span>
            </div>
          </div>
        </div>

        {/* Impact Message */}
        <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold italic">
            "Your FocusPet is currently powering UBI for the GoodDollar
            community." 🌍✨
          </p>
        </div>
      </div>
    </div>
  );
}
