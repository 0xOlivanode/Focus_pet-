"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  Zap,
  Target,
  Sparkles,
  Trophy,
  Globe,
  ShieldCheck,
  Heart,
  ShoppingBag,
} from "lucide-react";

interface OnboardingModalProps {
  onClose: () => void;
}

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1);

  const steps = [
    {
      id: 1,
      title: "Focus to Start",
      description:
        "Set your timer and engage in deep work. Your pet stays an egg until you complete your first session! 🧗",
      icon: <Target className="w-8 h-8 text-indigo-500" />,
      image: "🥚",
      impact: "Hatch your pet & earn base XP",
    },
    {
      id: 2,
      title: "Supercharge",
      description:
        "Stream G$ to the UBI pool to reach 'God Mode'. You'll get 100% Health stability and up to 2.0x XP multipliers! 🚀",
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      image: "⚡️",
      impact: "Boost XP & auto-heal pet",
    },
    {
      id: 3,
      title: "The Shop",
      description:
        "Spend earned G$ on Food to heal, Shields to prevent decay, and Cosmetics to give your pet a unique style. 🕶️",
      icon: <ShoppingBag className="w-8 h-8 text-pink-500" />,
      image: "🛍️",
      impact: "Level up faster & look cool",
    },
    {
      id: 4,
      title: "Global Impact",
      description:
        "Every second you focus, you're contributing to the Global UBI pool. Your productivity literally feeds the world. ❤️",
      icon: <Globe className="w-8 h-8 text-green-500" />,
      image: "🌍",
      impact: "Help provide basic income",
    },
    {
      id: 5,
      title: "Verified Identity",
      description:
        "Complete Face Verification to earn a 'Verified Focuser' badge. Secure your place on the leaderboard! 🏅",
      icon: <ShieldCheck className="w-8 h-8 text-blue-500" />,
      image: "🛡️",
      impact: "Badge & Leaderboard prestige",
    },
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
      />

      {/* Modal Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative bg-white dark:bg-neutral-900 w-full max-w-md rounded-[2rem] md:rounded-[2.5rem] overflow-hidden shadow-2xl border border-neutral-100 dark:border-neutral-800 mx-4 md:mx-0"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="p-6 md:p-10 flex flex-col items-center text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 bg-neutral-50 dark:bg-neutral-800 rounded-full flex items-center justify-center text-6xl mb-8 shadow-inner">
                {currentStep.image}
              </div>

              {/* <div className="mb-4 inline-flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                {currentStep.icon}
              </div> */}

              <h2 className="text-2xl font-black mb-3 tracking-tight">
                {currentStep.title}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-[280px] text-sm font-medium mb-6">
                {currentStep.description}
              </p>

              {currentStep.impact && (
                <div className="flex items-center gap-2 px-4 py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
                    Impact: {currentStep.impact}
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Dots */}
          <div className="flex gap-2 mt-10">
            {steps.map((s) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s.id
                    ? "w-8 bg-indigo-500"
                    : "w-1.5 bg-neutral-200 dark:bg-neutral-700"
                }`}
              />
            ))}
          </div>

          <div className="w-full mt-10">
            {step < 5 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 group shadow-xl shadow-indigo-500/20 active:scale-95"
              >
                Next Step
                <ArrowRight
                  size={18}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20 active:scale-95"
              >
                Let's Go! 🚀
              </button>
            )}

            <button
              onClick={onClose}
              className="mt-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              Skip Tutorial
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
