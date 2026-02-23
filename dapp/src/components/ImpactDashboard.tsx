"use client";

import React from "react";
import { motion } from "framer-motion";
import { Globe, Heart, TrendingUp, Award, Info } from "lucide-react";
import { formatEther } from "viem";

interface ImpactDashboardProps {
  totalDonated: bigint;
  xp: number;
}

export function ImpactDashboard({ totalDonated, xp }: ImpactDashboardProps) {
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat 1: Total Contributed */}
          <div className="p-6 rounded-3xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-100 dark:border-neutral-800 hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-2 mb-4 text-emerald-500">
              <Heart size={16} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                G$ Donated
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-neutral-900 dark:text-white tracking-tighter">
                {donatedAmount}
              </span>
              <span className="text-xs font-bold text-emerald-500">G$</span>
            </div>
          </div>

          {/* Stat 2: Focus Hours Impact */}
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

          {/* Stat 3: Community Rank */}
          <div className="p-6 rounded-3xl bg-linear-to-br from-indigo-500 to-indigo-700 text-white border border-transparent shadow-lg shadow-indigo-500/20 hover:scale-[1.02] transition-transform">
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <Award size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Contribution Level
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight leading-tight">
                Top 5%
              </span>
              <div className="p-1 bg-white/20 rounded-full">
                <Info size={12} />
              </div>
            </div>
            <p className="text-[9px] mt-2 opacity-60 font-medium">
              Calculated based on G$ ecosystem impact.
            </p>
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
