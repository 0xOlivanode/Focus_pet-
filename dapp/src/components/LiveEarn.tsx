"use client";

import React, { useEffect, useState, useMemo } from "react";
import { motion, useSpring, useTransform } from "framer-motion";
import { Coins, Zap, Flame } from "lucide-react";

interface LiveEarnProps {
  elapsedSeconds: number;
  isSupercharged?: boolean;
  streak?: number;
  className?: string;
}

export function LiveEarn({
  elapsedSeconds,
  isSupercharged = false,
  streak = 0,
  className,
}: LiveEarnProps) {
  // Base rate: 50 G$/hr -> 0.01388... G$/sec
  const BASE_RATE_PER_SEC = 50 / 3600;

  // Multipliers
  const superchargeMult = isSupercharged ? 1.5 : 1.0;
  const streakMult = streak >= 3 ? 1.2 : 1.0;
  const totalMultiplier = superchargeMult * streakMult;

  const currentEarned = elapsedSeconds * BASE_RATE_PER_SEC * totalMultiplier;

  // Spring animation for smooth ticking
  const springValue = useSpring(currentEarned, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    springValue.set(currentEarned);
  }, [currentEarned, springValue]);

  // Format with 2 decimals
  const displayValue = useTransform(springValue, (latest) => latest.toFixed(2));

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-black/20 backdrop-blur-md rounded-2xl border border-white/20 dark:border-white/5 shadow-lg">
        <div className="relative">
          <Coins className="w-4 h-4 text-emerald-500" />
          {isSupercharged && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1"
            >
              <Zap className="w-2 h-2 text-cyan-400 fill-cyan-400" />
            </motion.div>
          )}
        </div>

        <div className="flex items-baseline gap-1">
          <motion.span className="text-lg font-black font-mono text-neutral-800 dark:text-white">
            {displayValue}
          </motion.span>
          <span className="text-[10px] font-black text-neutral-400 uppercase tracking-tighter">
            G$
          </span>
        </div>

        {(isSupercharged || streak >= 3) && (
          <div className="flex items-center gap-1 border-l border-neutral-200 dark:border-white/10 ml-2 pl-2">
            {isSupercharged && (
              <div className="flex items-center text-[10px] font-bold text-cyan-500 uppercase">
                <span className="mr-0.5">x1.5</span>
              </div>
            )}
            {streak >= 3 && (
              <div className="flex items-center text-[10px] font-bold text-orange-500 uppercase">
                <Flame className="w-2 h-2 mr-0.5" />
                <span>x1.2</span>
              </div>
            )}
          </div>
        )}
      </div>

      <p className="text-[8px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em]">
        Productivity Mining Active
      </p>
    </div>
  );
}
