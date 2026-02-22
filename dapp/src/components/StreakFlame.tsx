"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";

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
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-colors ${
        count >= 3
          ? "bg-orange-500/10 border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 shadow-orange-500/10"
          : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400"
      }`}
    >
      <div className="relative">
        {/* <Flame
          size={16}
          className={`${count === 1 ? "fill-orange-500/20 animate-pulse" : ""}`}
        /> */}
        🔥
        {count >= 5 && (
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="absolute inset-0 bg-orange-400 blur-md rounded-full -z-10"
          />
        )}
      </div>
      <span className="text-xs font-black tracking-tighter">
        {count} DAY STREAK
      </span>
    </motion.div>
  );
}
