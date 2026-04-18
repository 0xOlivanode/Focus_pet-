"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Gift,
  RefreshCcw,
} from "lucide-react";
import { formatEther } from "viem";
import { useEngagementReward } from "@/hooks/useEngagementReward";
import { ENGAGEMENT_MIN_DAYS } from "@/config/contracts";

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

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Fire confetti on successful claim
  useEffect(() => {
    if (state === "claimed") {
      import("canvas-confetti").then(({ default: confetti }) => {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.65 },
          colors: ["#6366f1", "#22c55e", "#f59e0b", "#3b82f6"],
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

  if (!hasMounted) return null;

  // Hide when not relevant
  if (state === "unavailable" || state === "loading") return null;

  const rewardDisplay =
    rewardAmount > 0n
      ? `${parseFloat(formatEther(rewardAmount)).toFixed(2)} G$`
      : "G$";

  return (
    <div className="w-full mt-4 rounded-3xl overflow-hidden relative">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-emerald-600 to-teal-700 opacity-100" />
      {/* Dot texture */}
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />
      {/* Glow */}
      <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 p-5">
        <AnimatePresence mode="wait">

          {/* ── needs_sessions ── */}
          {state === "needs_sessions" && (
            <motion.div
              key="needs_sessions"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Left */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Gift size={15} className="text-white" />
                  </div>
                  <span className="text-white/80 font-black text-xs uppercase tracking-widest">
                    Focus Reward
                  </span>
                </div>
                <p className="text-white font-black text-lg leading-snug mb-3">
                  Earn {rewardDisplay} for building a habit
                </p>

                {/* Progress dots */}
                <div className="flex items-center gap-2">
                  {Array.from({ length: minDays }).map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                          i < sessionDaysCount
                            ? "bg-white shadow-lg shadow-white/20"
                            : "bg-white/20 border border-white/30"
                        }`}
                      >
                        {i < sessionDaysCount ? (
                          <CheckCircle2 size={14} className="text-emerald-600" />
                        ) : (
                          <span className="text-[10px] font-black text-white/60">
                            {i + 1}
                          </span>
                        )}
                      </div>
                      {i < minDays - 1 && (
                        <div
                          className={`h-0.5 w-6 rounded-full transition-all ${
                            i < sessionDaysCount - 1 ? "bg-white" : "bg-white/20"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                  <span className="text-white/60 text-xs font-bold ml-1">
                    {sessionDaysCount}/{minDays} focus days
                  </span>
                </div>

                <p className="text-white/50 text-[11px] font-medium mt-2 leading-relaxed">
                  Focus on {minDays - sessionDaysCount} more day
                  {minDays - sessionDaysCount !== 1 ? "s" : ""} to unlock your G$ reward.
                </p>
              </div>

              {/* Right — subtle badge */}
              <div className="sm:min-w-[130px] flex sm:justify-end">
                <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-4 py-2 rounded-2xl backdrop-blur-sm">
                  <Sparkles size={13} className="text-emerald-300" />
                  <span className="text-white/70 font-black text-xs">
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
              className="flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Gift size={15} className="text-white" />
                  </div>
                  <span className="text-white/80 font-black text-xs uppercase tracking-widest">
                    Focus Reward
                  </span>
                </div>
                <p className="text-white font-black text-lg leading-snug mb-1">
                  Earn {rewardDisplay} for focusing
                </p>
                <p className="text-white/50 text-[11px] font-medium leading-relaxed">
                  A one-time verification proves you're human — then rewards unlock automatically.
                </p>
              </div>

              <div className="flex flex-col items-stretch sm:items-end gap-2 sm:min-w-[160px]">
                <button
                  onClick={openVerification}
                  className="flex items-center justify-center gap-2 bg-white text-emerald-700 px-5 py-3 rounded-2xl font-black text-sm hover:bg-emerald-50 transition-all active:scale-95 shadow-lg shadow-black/20"
                >
                  <ShieldCheck size={15} />
                  Face Verify
                </button>
                <p className="text-white/40 text-[10px] font-medium text-center sm:text-right leading-tight px-1">
                  One-time face scan required
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
              className="flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Sparkles size={15} className="text-white" />
                  </div>
                  <span className="text-white/80 font-black text-xs uppercase tracking-widest">
                    Reward Unlocked
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-5xl font-black text-white tracking-tighter leading-none">
                    {rewardDisplay.split(" ")[0]}
                  </span>
                  <span className="text-white/60 font-bold text-base">G$</span>
                </div>

                <p className="text-white/50 text-[11px] font-medium leading-relaxed">
                  You've built a real focus habit. Claim your GoodDollar reward.
                </p>
              </div>

              <div className="flex flex-col items-stretch sm:items-end sm:min-w-[160px]">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={claim}
                  className="relative overflow-hidden flex items-center justify-center gap-2 bg-white text-emerald-700 px-5 py-3 rounded-2xl font-black text-sm shadow-lg shadow-black/20 hover:bg-emerald-50 transition-all group/btn"
                >
                  Claim Reward
                  <ArrowRight
                    size={15}
                    className="group-hover/btn:translate-x-0.5 transition-transform"
                  />
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-emerald-100/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                </motion.button>
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
              <Loader2 size={20} className="text-white animate-spin" />
              <span className="text-white font-black text-sm">
                Claiming your G$ reward...
              </span>
            </motion.div>
          )}

          {/* ── claimed ── */}
          {state === "claimed" && (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4"
            >
              {/* Success header */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg shadow-black/20 shrink-0">
                  <CheckCircle2 size={20} className="text-emerald-600" />
                </div>
                <div>
                  <p className="text-white font-black text-base leading-tight">
                    G$ Reward Claimed!
                  </p>
                  <p className="text-white/60 text-[11px] font-medium">
                    Your GoodDollar has been sent to your wallet.
                  </p>
                </div>
              </div>

              {/* Invite link */}
              <div className="bg-white/10 border border-white/20 rounded-2xl p-4 backdrop-blur-sm">
                <p className="text-white font-black text-xs uppercase tracking-widest mb-2">
                  Invite friends — earn when they claim too
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-white/60 text-xs font-medium truncate flex-1">
                    {inviteLink || "Loading..."}
                  </p>
                  <button
                    onClick={copyInviteLink}
                    className="shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check size={12} />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        Copy
                      </>
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
                <p className="text-white/50 text-[11px] font-medium mt-0.5">
                  {error || "Could not process reward"}
                </p>
              </div>
              <button
                onClick={refresh}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-2xl font-bold text-xs transition-all active:scale-95 shrink-0"
              >
                <RefreshCcw size={13} />
                Retry
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
