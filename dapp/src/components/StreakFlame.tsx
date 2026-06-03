"use client";

import { motion } from "framer-motion";

interface StreakFlameProps {
  count: number;
}

export function StreakFlame({ count }: StreakFlameProps) {
  if (count === 0) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border shadow-sm transition-colors ${
        count >= 3
          ? "bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 shadow-orange-500/10"
          : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400"
      }`}
    >
      <div className="relative">
        🔥
      </div>
      <span className="text-xs font-black tracking-tighter">
        {count} <span className="hidden sm:inline">DAY STREAK</span>
      </span>
    </motion.div>
  );
}
