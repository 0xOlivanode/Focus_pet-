"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  RefreshCcw,
} from "lucide-react";
import { formatEther } from "viem";
import { useEngagementReward } from "@/hooks/useEngagementReward";

export function EngagementRewardBanner() {
  const {
    state,
    sessionDaysCount,
    minDays,
    rewardAmount,
    inviteLink,
    claim,
    error,
    refresh,
    openVerification,
  } = useEngagementReward();

  const [copied, setCopied] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => { setHasMounted(true); }, []);

  useEffect(() => {
    if (state === "claimed") {
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#01FF8B", "#C48E57", "#ffffff", "#A9A9A9"],
        });
      });
    }
  }, [state]);

  const copyInviteLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!hasMounted || state === "unavailable" || state === "loading") return null;

  const rewardDisplay =
    rewardAmount > 0n
      ? `${parseFloat(formatEther(rewardAmount)).toFixed(2)}`
      : "—";

  return (
    <div className="w-full mt-6 rounded-3xl overflow-hidden bg-[#111111] border border-neutral-800">
      <div className="p-5">
        <AnimatePresence mode="wait">

          {/* ── needs_sessions ── */}
          {state === "needs_sessions" && (
            <motion.div
              key="needs_sessions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <div className="flex-1">
                <p className="text-[#A9A9A9] text-xs font-semibold uppercase tracking-widest mb-3">
                  Focus Reward
                </p>
                <p className="text-white font-black text-lg leading-snug mb-4">
                  Earn G$ for building a habit
                </p>

                {/* Progress dots */}
                <div className="flex items-center gap-2 mb-3">
                  {Array.from({ length: minDays }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          i < sessionDaysCount
                            ? "bg-[#C48E57]"
                            : "bg-[#1a1a1a] border border-neutral-700"
                        }`}
                      >
                        {i < sessionDaysCount ? (
                          <CheckCircle2 size={14} className="text-black" />
                        ) : (
                          <span className="text-[10px] font-black text-neutral-500">
                            {i + 1}
                          </span>
                        )}
                      </div>
                      {i < minDays - 1 && (
                        <div
                          className={`h-px w-5 rounded-full transition-all ${
                            i < sessionDaysCount - 1
                              ? "bg-[#C48E57]"
                              : "bg-neutral-700"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                  <span className="text-[#A9A9A9] text-xs font-medium ml-1">
                    {sessionDaysCount}/{minDays} days
                  </span>
                </div>

                <p className="text-neutral-600 text-xs font-medium leading-relaxed">
                  {minDays - sessionDaysCount} more focus day
                  {minDays - sessionDaysCount !== 1 ? "s" : ""} to unlock your G$ reward.
                </p>
              </div>

              <div className="sm:min-w-[120px] flex sm:justify-end">
                <div className="inline-flex items-center gap-1.5 bg-[#1a1a1a] border border-neutral-800 px-4 py-2 rounded-full">
                  <span className="text-neutral-500 text-xs font-semibold">
                    Almost there
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── not_verified ── */}
          {state === "not_verified" && (
            <motion.div
              key="not_verified"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <div className="flex-1">
                <p className="text-[#A9A9A9] text-xs font-semibold uppercase tracking-widest mb-3">
                  Focus Reward
                </p>
                <p className="text-white font-black text-lg leading-snug mb-1">
                  Earn G$ for focusing
                </p>
                <p className="text-neutral-600 text-xs font-medium leading-relaxed">
                  A one-time face scan unlocks your GoodDollar reward automatically.
                </p>
              </div>

              <div className="flex flex-col items-stretch sm:items-end gap-2 sm:min-w-[150px]">
                <button
                  onClick={openVerification}
                  className="flex items-center justify-center gap-2 bg-[#01FF8B] text-[#070707] px-5 py-3 rounded-full font-black text-sm hover:brightness-110 transition-all active:scale-95"
                >
                  <ShieldCheck size={15} />
                  Face Verify
                </button>
                <p className="text-neutral-600 text-[10px] font-medium text-center sm:text-right">
                  One-time only
                </p>
              </div>
            </motion.div>
          )}

          {/* ── eligible ── */}
          {state === "eligible" && (
            <motion.div
              key="eligible"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <div className="flex-1">
                <p className="text-[#A9A9A9] text-xs font-semibold uppercase tracking-widest mb-3">
                  Reward Unlocked
                </p>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-5xl font-black text-white tracking-tighter leading-none">
                    {rewardDisplay}
                  </span>
                  <span className="text-[#A9A9A9] font-bold text-base">G$</span>
                </div>
                <p className="text-neutral-600 text-xs font-medium leading-relaxed">
                  You've built a real focus habit. Claim your GoodDollar reward.
                </p>
              </div>

              <div className="flex flex-col items-stretch sm:items-end sm:min-w-[150px]">
                <button
                  onClick={claim}
                  className="flex items-center justify-center gap-2 bg-[#01FF8B] text-[#070707] px-5 py-3 rounded-full font-black text-sm hover:brightness-110 transition-all active:scale-95"
                >
                  Claim G$
                  <ArrowRight size={15} />
                </button>
              </div>
            </motion.div>
          )}

          {/* ── claiming ── */}
          {state === "claiming" && (
            <motion.div
              key="claiming"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center gap-3 py-3"
            >
              <Loader2 size={18} className="text-[#01FF8B] animate-spin" />
              <span className="text-white font-semibold text-sm">
                Claiming your G$ reward…
              </span>
            </motion.div>
          )}

          {/* ── claimed ── */}
          {state === "claimed" && (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#01FF8B1A] rounded-full flex items-center justify-center shrink-0 border border-[#01FF8B]/20">
                  <CheckCircle2 size={18} className="text-[#01FF8B]" />
                </div>
                <div>
                  <p className="text-white font-black text-base leading-tight">
                    G$ Reward Claimed
                  </p>
                  <p className="text-neutral-600 text-xs font-medium">
                    Sent to your wallet.
                  </p>
                </div>
              </div>

              {/* Invite link */}
              <div className="bg-[#1a1a1a] border border-neutral-800 rounded-2xl p-4">
                <p className="text-[#A9A9A9] text-xs font-semibold uppercase tracking-widest mb-2">
                  Invite friends — earn when they claim
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-neutral-500 text-xs font-medium truncate flex-1 font-mono">
                    {inviteLink || "Loading…"}
                  </p>
                  <button
                    onClick={copyInviteLink}
                    className="shrink-0 flex items-center gap-1.5 bg-[#111111] hover:bg-neutral-800 border border-neutral-700 text-white px-3 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95"
                  >
                    {copied ? (
                      <><Check size={11} /> Copied</>
                    ) : (
                      <><Copy size={11} /> Copy</>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── error ── */}
          {state === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between gap-4"
            >
              <div>
                <p className="text-white font-black text-sm">
                  Something went wrong
                </p>
                <p className="text-neutral-600 text-xs font-medium mt-0.5">
                  {error || "Could not process reward"}
                </p>
              </div>
              <button
                onClick={refresh}
                className="flex items-center gap-1.5 bg-[#1a1a1a] hover:bg-neutral-800 border border-neutral-800 text-neutral-300 px-4 py-2 rounded-full font-semibold text-xs transition-all active:scale-95 shrink-0"
              >
                <RefreshCcw size={12} />
                Retry
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
