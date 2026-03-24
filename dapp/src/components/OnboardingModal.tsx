"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  Zap,
  Trophy,
  ShieldCheck,
  ShoppingBag,
  Heart,
  Coins,
} from "lucide-react";

interface OnboardingModalProps {
  onClose: () => void;
}

const steps = [
  {
    id: 1,
    emoji: "🥚",
    title: "Focus. Earn. Evolve.",
    description:
      "FocusPet turns your deep work into a living creature. Complete focus sessions to hatch your egg, earn real G$ crypto, and evolve your pet from a baby all the way to an Elder.",
    tag: "The core loop",
    tagColor: "indigo",
    bullets: [
      { icon: <Zap size={13} />, text: "10 min minimum to earn XP" },
      { icon: <Coins size={13} />, text: "G$ is real GoodDollar cryptocurrency" },
      { icon: <ArrowRight size={13} />, text: "5 evolution stages to unlock" },
    ],
  },
  {
    id: 2,
    emoji: "❤️",
    title: "Your Pet Can Die",
    description:
      "Health decays every day you don't focus. Hit 0% and your pet dies — you'll need to spend G$ to revive it. Stay consistent or keep it fed to stay alive.",
    tag: "Stay consistent",
    tagColor: "red",
    bullets: [
      { icon: <Heart size={13} />, text: "Health drops daily without sessions" },
      { icon: <ShoppingBag size={13} />, text: "Buy Food from the Shop to heal" },
      { icon: <ShieldCheck size={13} />, text: "Shields block decay for 24h" },
    ],
  },
  {
    id: 3,
    emoji: "⚡️",
    title: "Supercharge Mode",
    description:
      "Stream G$ to the GoodDollar UBI pool to unlock God Mode — your pet gets 100% health stability and up to a 2x XP multiplier. The more you stream, the bigger the boost.",
    tag: "Max your gains",
    tagColor: "amber",
    bullets: [
      { icon: <Zap size={13} />, text: "Up to 2.0x XP on every session" },
      { icon: <Heart size={13} />, text: "Auto-heals your pet to 100%" },
      { icon: <ArrowRight size={13} />, text: "Stop any time, no lock-in" },
    ],
  },
  {
    id: 4,
    emoji: "🏆",
    title: "Climb the Leaderboard",
    description:
      "Every session earns XP that pushes you up the global leaderboard. Compete with Focusers worldwide — your rank, streak, and pet stage are all visible to everyone.",
    tag: "Compete globally",
    tagColor: "violet",
    bullets: [
      { icon: <Trophy size={13} />, text: "Live rankings updated in real-time" },
      { icon: <ShieldCheck size={13} />, text: "Verified badge for top credibility" },
      { icon: <Zap size={13} />, text: "Streaks shown on your public profile" },
    ],
  },
  {
    id: 5,
    emoji: "🌍",
    title: "Your Focus Feeds the World",
    description:
      "Every minute you focus contributes to the GoodDollar UBI pool — a real fund that distributes basic income to people in need globally. Productivity with purpose.",
    tag: "Real-world impact",
    tagColor: "green",
    bullets: [
      { icon: <Coins size={13} />, text: "G$ reaches people in 180+ countries" },
      { icon: <ShieldCheck size={13} />, text: "Verify identity to unlock more rewards" },
      { icon: <Heart size={13} />, text: "Your streak = your contribution streak" },
    ],
  },
];

const tagStyles: Record<string, string> = {
  indigo: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
  red:    "bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400",
  amber:  "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  violet: "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  green:  "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
};

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const current = steps[step - 1];
  const isLast = step === steps.length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="relative bg-white dark:bg-neutral-900 w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border border-neutral-100 dark:border-neutral-800"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors z-10"
        >
          <X size={18} />
        </button>

        <div className="p-7 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center w-full"
            >
              {/* Emoji */}
              <div className="w-20 h-20 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center text-5xl mb-5 shadow-inner">
                {current.emoji}
              </div>

              {/* Tag */}
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 ${tagStyles[current.tagColor]}`}>
                {current.tag}
              </span>

              {/* Title */}
              <h2 className="text-xl font-black tracking-tight mb-2 text-neutral-900 dark:text-white">
                {current.title}
              </h2>

              {/* Description */}
              <p className="text-neutral-500 dark:text-neutral-400 text-sm font-medium leading-relaxed mb-5">
                {current.description}
              </p>

              {/* Bullets */}
              <div className="w-full flex flex-col gap-2">
                {current.bullets.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl text-left"
                  >
                    <span className="text-indigo-500 shrink-0">{b.icon}</span>
                    <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                      {b.text}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div className="flex gap-1.5 mt-6">
            {steps.map((s) => (
              <button
                key={s.id}
                onClick={() => setStep(s.id)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s.id
                    ? "w-6 bg-indigo-500"
                    : "w-1.5 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="w-full mt-5 flex flex-col gap-3">
            <button
              onClick={isLast ? onClose : () => setStep(step + 1)}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 group shadow-lg shadow-indigo-500/20"
            >
              {isLast ? "Let's Go! 🚀" : (
                <>
                  Next
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              Skip Tutorial
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
