"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Waves, Zap, X, Flame, Leaf } from "lucide-react";
import { parseEther } from "viem";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

export interface StreamTier {
  label: string;
  description: string;
  amountPerMonth: number;
  icon: React.ReactNode;
  color: string;
  cardClass: string;
}

export const STREAM_TIERS: StreamTier[] = [
  {
    label: "Gentle Flow",
    description:
      "1.2x XP Boost & Emerald Aura. No health decay. Funds the UBI pool.",
    amountPerMonth: 10,
    icon: <Leaf className="w-5 h-5" />,
    color: "text-emerald-500",
    cardClass:
      "border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5",
  },
  {
    label: "Power Surge",
    description:
      "1.4x XP Boost & Cyan Energy Aura. No health decay. Higher UBI impact.",
    amountPerMonth: 50,
    icon: <Zap className="w-5 h-5" />,
    color: "text-cyan-500",
    cardClass:
      "border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5",
  },
  {
    label: "Max Overdrive",
    description:
      "1.7x XP Boost & Indigo Explosion. No health decay. Maximum UBI impact.",
    amountPerMonth: 100,
    icon: <Flame className="w-5 h-5" />,
    color: "text-indigo-500",
    cardClass:
      "border-indigo-500/20 hover:border-indigo-500/40 hover:bg-indigo-500/5",
  },
];

interface SuperchargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isStreaming: boolean;
  onStart: (amountPerMonth: bigint) => void;
  onStop: () => void;
}

export function SuperchargeModal({
  isOpen,
  onClose,
  isStreaming,
  onStart,
  onStop,
}: SuperchargeModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSelect = (tier: StreamTier) => {
    onStart(parseEther(String(tier.amountPerMonth)));
    onClose();
  };

  const handleStop = () => {
    onStop();
    onClose();
  };

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-99999 flex items-end sm:items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 rounded-4xl p-6 shadow-2xl"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 flex items-center justify-center text-neutral-400 transition-colors"
            >
              <X size={14} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Waves className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <h2 className="text-neutral-900 dark:text-white font-black text-base">
                  Supercharge Your Pet
                </h2>
                <p className="text-neutral-400 text-xs">
                  Boost your progress & protect your pet’s health.
                </p>
              </div>
            </div>

            {/* Already streaming — show stop option */}
            {isStreaming ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
                  <Waves className="w-4 h-4 text-cyan-500 animate-pulse" />
                  <p className="text-cyan-600 dark:text-cyan-300 text-sm font-bold">
                    Stream is active
                  </p>
                </div>
                <p className="text-neutral-400 text-xs text-center">
                  G$ is flowing from your wallet to the UBI Pool. Your pet is
                  currently at maximum health and boosted! ⚡️
                </p>
                <button
                  onClick={handleStop}
                  className="w-full py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-black hover:bg-red-500/20 transition-all active:scale-95"
                >
                  Stop Stream
                </button>
              </div>
            ) : (
              /* Tier Selection */
              <div className="flex flex-col gap-3">
                {STREAM_TIERS.map((tier) => (
                  <motion.button
                    key={tier.label}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSelect(tier)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl bg-neutral-50 dark:bg-white/5 border transition-all text-left ${tier.cardClass}`}
                  >
                    <div className={`shrink-0 ${tier.color}`}>{tier.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-black text-sm ${tier.color}`}>
                        {tier.label}
                      </p>
                      <p className="text-neutral-400 text-[11px] leading-tight mt-0.5">
                        {tier.description}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-neutral-800 dark:text-white font-black text-sm">
                        {tier.amountPerMonth} G$
                      </p>
                      <p className="text-neutral-400 text-[10px]">per month</p>
                    </div>
                  </motion.button>
                ))}
                <p className="text-neutral-400 text-[10px] text-center mt-1 leading-relaxed">
                  Streams flow to the official GoodDollar UBI Pool on Celo.
                  <br />
                  Boosts stack with Energy Drinks! Stop at any time.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}
