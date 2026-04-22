"use client";

import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, ShieldCheck } from "lucide-react";

interface VerifiedBadgeProps {
  size?: number;
  showText?: boolean;
}

export function VerifiedBadge({
  size = 16,
  showText = false,
}: VerifiedBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="inline-flex items-center gap-1.5"
    >
      <div className="p-0.5 bg-linear-to-br from-indigo-500 to-purple-600 rounded-full shadow-lg shadow-indigo-500/20">
        <ShieldCheck size={size} className="text-white" />
      </div>

      {showText && (
        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
          Verified Focuser
        </span>
      )}
    </motion.div>
  );
}
