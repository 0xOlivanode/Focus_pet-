"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Waves, Zap, X, Flame, Leaf } from "lucide-react";
import { parseEther, formatEther } from "viem";
import { createPortal } from "react-dom";
import { useState, useEffect } from "react";

export interface StreamTier {
  label: string;
  description: string;
  amountPerMonth: number;
  icon: React.ReactNode;
  color: string;
}

export const STREAM_TIERS: StreamTier[] = [
  {
    label: "Gentle flow",
    description:
      "1.2x XP boost & emerald aura. No health decay. Fund the UBI pool.",
    amountPerMonth: 10,
    icon: <Leaf className="w-4 h-4" />,
    color: "text-emerald-400",
  },
  {
    label: "Power surge",
    description:
      "1.4x XP boost & cyan energy aura. No health decay. Higher UBI impact.",
    amountPerMonth: 50,
    icon: <Zap className="w-4 h-4" />,
    color: "text-cyan-400",
  },
  {
    label: "Max overdrive",
    description:
      "1.7x XP boost & indigo explosion aura. No health decay. Maximum UBI impact.",
    amountPerMonth: 100,
    icon: <Flame className="w-4 h-4" />,
    color: "text-indigo-400",
  },
];

interface SuperchargeModalProps {
  isOpen: boolean;
  onClose: () => void;
  isStreaming: boolean;
  flowRate?: bigint;
  onStart: (amountPerMonth: bigint) => void;
  onStop: () => void;
}

export function SuperchargeModal({
  isOpen,
  onClose,
  isStreaming,
  flowRate,
  onStart,
  onStop,
}: SuperchargeModalProps) {
  const monthlyAmount = flowRate
    ? Number(formatEther(flowRate * BigInt(30 * 24 * 60 * 60)))
    : 0;
  const activeTier =
    monthlyAmount >= 90
      ? STREAM_TIERS[2]
      : monthlyAmount >= 45
        ? STREAM_TIERS[1]
        : monthlyAmount >= 9
          ? STREAM_TIERS[0]
          : null;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleSelect = (tier: StreamTier) => {
    onStart(parseEther(String(tier.amountPerMonth)));
    onClose();
  };

  const handleStop = () => {
    onStop();
    onClose();
  };

  const sheet = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
          />

          {/* Bottom sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="relative w-full max-w-full lg:max-w-[960px] mx-auto bg-[#111111] rounded-t-[2rem] overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-4 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-700" />
            </div>

            <div className="px-6 pt-4 pb-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-7">
                <div>
                  <h2 className="text-white text-xl font-semibold leading-tight">
                    {isStreaming ? "Pet Supercharged!" : "Supercharge Your Pet"}
                  </h2>
                  <p className="text-neutral-500 text-sm mt-1">
                    {isStreaming && activeTier
                      ? `${activeTier.label} — ${activeTier.description}`
                      : "Boost your progress & protect your pet's health."}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 transition-colors shrink-0 ml-4 mt-0.5"
                >
                  <X size={14} />
                </button>
              </div>

              {isStreaming ? (
                <div className="flex flex-col gap-3">
                  {/* Active stream status card */}
                  <div className="rounded-2xl border border-neutral-800 bg-[#1a1a1a] px-5 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-white shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white text-sm font-semibold leading-tight">Stream active</p>
                          {activeTier && (
                            <span className={`text-xs font-medium capitalize ${activeTier.color}`}>
                              · {activeTier.label}
                            </span>
                          )}
                        </div>
                        <p className="text-neutral-500 text-xs mt-0.5">G$ is flowing to the UBI Pool</p>
                      </div>
                      {activeTier ? (
                        <span className={`ml-auto shrink-0 ${activeTier.color}`}>{activeTier.icon}</span>
                      ) : (
                        <Waves className="w-4 h-4 text-neutral-700 ml-auto shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Benefit pills */}
                  <div className="flex gap-2">
                    {["Health locked", "XP boosted", "UBI impact"].map((label) => (
                      <div
                        key={label}
                        className="flex-1 text-center py-2 rounded-xl bg-[#1a1a1a] border border-neutral-800"
                      >
                        <span className="text-[11px] font-medium text-neutral-400">{label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Stop button */}
                  <button
                    onClick={handleStop}
                    className="w-full py-3.5 rounded-2xl bg-[#1a1a1a] hover:bg-[#222222] text-red-500 hover:text-red-400 text-sm font-medium transition-all active:scale-[0.98] border border-neutral-800 mt-1"
                  >
                    Stop Stream
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {STREAM_TIERS.map((tier) => (
                    <motion.button
                      key={tier.label}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelect(tier)}
                      className="flex items-center gap-4 px-5 py-4 bg-[#1a1a1a] rounded-2xl border border-neutral-800 hover:border-neutral-700 transition-colors text-left w-full"
                    >
                      {/* Radio circle */}
                      <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                        <div className={tier.color}>{tier.icon}</div>
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium capitalize">
                          {tier.label}
                        </p>
                        <p className="text-neutral-500 text-xs leading-snug mt-0.5">
                          {tier.description}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-right shrink-0">
                        <p className="text-white text-base font-semibold tabular-nums">
                          {tier.amountPerMonth} G$
                        </p>
                        <p className="text-neutral-500 text-xs">Per month</p>
                      </div>
                    </motion.button>
                  ))}

                  <p className="text-neutral-600 text-[11px] text-center mt-2 leading-relaxed">
                    Streams flow to the official GoodDollar UBI Pool on Celo.
                    Boosts stack with Energy Drinks! Stop at any time.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(sheet, document.body);
}
