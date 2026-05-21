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
  Target,
  Globe,
} from "lucide-react";
import { IS_MINIPAY } from "@/lib/miniPayEthereum";

interface OnboardingModalProps {
  onClose: () => void;
}

const stepsDefault = [
  {
    id: 1,
    icon: <Target size={22} className="text-white" />,
    tag: "The core loop",
    title: "Focus. Earn. Evolve.",
    description:
      "FocusPet turns your deep work into a living creature. Complete focus sessions to hatch your egg, earn real G$, and evolve your pet from a baby all the way to an Elder.",
    bullets: [
      { icon: <Zap size={13} />, text: "10 min minimum to earn XP" },
      { icon: <Coins size={13} />, text: "G$ is digital money you can actually use" },
      { icon: <ArrowRight size={13} />, text: "5 evolution stages to unlock" },
    ],
  },
  {
    id: 2,
    icon: <Heart size={22} className="text-white" />,
    tag: "Stay consistent",
    title: "Your Pet Can Die",
    description:
      "Health decays every day you don't focus. Hit 0% and your pet dies — you'll need to spend G$ to revive it. Stay consistent or keep it fed to stay alive.",
    bullets: [
      { icon: <Heart size={13} />, text: "Health drops daily without sessions" },
      { icon: <ShoppingBag size={13} />, text: "Buy food from the shop to heal" },
      { icon: <ShieldCheck size={13} />, text: "Shields block decay for 24h" },
    ],
  },
  {
    id: 3,
    icon: <Zap size={22} className="text-white" />,
    tag: "Max your gains",
    title: "Supercharge Mode",
    description:
      "Stream G$ to the GoodDollar UBI pool to unlock Supercharge — your pet gets full health stability and up to a 1.7x XP multiplier. The more you stream, the bigger the boost.",
    bullets: [
      { icon: <Zap size={13} />, text: "Up to 1.7x XP on every session" },
      { icon: <Heart size={13} />, text: "No health decay while streaming" },
      { icon: <ArrowRight size={13} />, text: "Stop any time, no lock-in" },
    ],
  },
  {
    id: 4,
    icon: <Trophy size={22} className="text-white" />,
    tag: "Compete globally",
    title: "Climb the Leaderboard",
    description:
      "Every session earns XP that pushes you up the global leaderboard. Compete with Focusers worldwide — your rank, streak, and pet stage are all visible to everyone.",
    bullets: [
      { icon: <Trophy size={13} />, text: "Live rankings updated in real-time" },
      { icon: <ShieldCheck size={13} />, text: "Verified badge for top credibility" },
      { icon: <Zap size={13} />, text: "Streaks shown on your public profile" },
    ],
  },
  {
    id: 5,
    icon: <Globe size={22} className="text-white" />,
    tag: "Real-world impact",
    title: "Your Focus Feeds the World",
    description:
      "Every minute you focus contributes to the GoodDollar UBI pool — a real fund that distributes basic income to people in need globally. Productivity with purpose.",
    bullets: [
      { icon: <Coins size={13} />, text: "G$ reaches people in 180+ countries" },
      { icon: <ShieldCheck size={13} />, text: "Verify identity to unlock more rewards" },
      { icon: <Heart size={13} />, text: "Your streak = your contribution streak" },
    ],
  },
];

const stepsMiniPay = [
  {
    id: 1,
    icon: <Target size={22} className="text-white" />,
    tag: "The core loop",
    title: "Focus. Earn. Evolve.",
    description:
      "FocusPet turns your deep work into a living creature. Complete focus sessions to hatch your egg, earn XP, and evolve your pet from a baby all the way to an Elder.",
    bullets: [
      { icon: <Zap size={13} />, text: "10 min minimum to earn XP" },
      { icon: <ArrowRight size={13} />, text: "5 evolution stages to unlock" },
      { icon: <Trophy size={13} />, text: "Climb the global leaderboard" },
    ],
  },
  {
    id: 2,
    icon: <Heart size={22} className="text-white" />,
    tag: "Stay consistent",
    title: "Your Pet Can Die",
    description:
      "Health decays every day you don't focus. Hit 0% and your pet dies — you'll need to revive it from the shop. Stay consistent or keep it fed to stay alive.",
    bullets: [
      { icon: <Heart size={13} />, text: "Health drops daily without sessions" },
      { icon: <ShoppingBag size={13} />, text: "Buy food from the shop to heal" },
      { icon: <ShieldCheck size={13} />, text: "Shields block decay for 24h" },
    ],
  },
  {
    id: 3,
    icon: <Trophy size={22} className="text-white" />,
    tag: "Compete globally",
    title: "Climb the Leaderboard",
    description:
      "Every session earns XP that pushes you up the global leaderboard. Compete with Focusers worldwide — your rank, streak, and pet stage are all visible to everyone.",
    bullets: [
      { icon: <Trophy size={13} />, text: "Live rankings updated in real-time" },
      { icon: <ShieldCheck size={13} />, text: "Verified badge for top credibility" },
      { icon: <Zap size={13} />, text: "Streaks shown on your public profile" },
    ],
  },
  {
    id: 4,
    icon: <Globe size={22} className="text-white" />,
    tag: "Real-world impact",
    title: "Focus with Purpose",
    description:
      "Every session you complete is a commitment to discipline — and your pet's evolution is public proof of it. Stay consistent and leave your mark on the leaderboard.",
    bullets: [
      { icon: <Zap size={13} />, text: "Daily streaks multiply your XP" },
      { icon: <ShieldCheck size={13} />, text: "Verify identity to unlock more rewards" },
      { icon: <Heart size={13} />, text: "Your streak = your contribution streak" },
    ],
  },
];

const steps = IS_MINIPAY ? stepsMiniPay : stepsDefault;

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
        className="absolute inset-0 bg-black/80"
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative bg-[#111111] w-full max-w-sm rounded-3xl overflow-hidden border border-neutral-800"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors z-10"
        >
          <X size={13} />
        </button>

        <div className="p-7 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col items-center w-full"
            >
              {/* Icon */}
              <div className="w-14 h-14 bg-[#1a1a1a] border border-neutral-800 rounded-2xl flex items-center justify-center mb-5">
                {current.icon}
              </div>

              {/* Tag */}
              <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500 mb-3">
                {current.tag}
              </span>

              {/* Title */}
              <h2 className="text-xl font-medium text-white mb-2 tracking-tight">
                {current.title}
              </h2>

              {/* Description */}
              <p className="text-neutral-500 text-sm leading-relaxed mb-5">
                {current.description}
              </p>

              {/* Bullets */}
              <div className="w-full flex flex-col gap-2">
                {current.bullets.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] border border-neutral-800 rounded-xl text-left"
                  >
                    <span className="text-neutral-500 shrink-0">{b.icon}</span>
                    <span className="text-sm text-neutral-300">{b.text}</span>
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
                className={`h-1 rounded-full transition-all duration-300 ${
                  step === s.id
                    ? "w-6 bg-white"
                    : "w-1.5 bg-neutral-700 hover:bg-neutral-500"
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="w-full mt-5 flex flex-col gap-3">
            <button
              onClick={isLast ? onClose : () => setStep(step + 1)}
              className="w-full py-3.5 bg-white hover:bg-neutral-100 active:scale-[0.98] text-black rounded-full font-semibold text-sm transition-all flex items-center justify-center gap-2 group"
            >
              {isLast ? "Let's go" : (
                <>
                  Next
                  <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-xs text-neutral-600 hover:text-neutral-400 transition-colors uppercase tracking-widest font-medium"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
