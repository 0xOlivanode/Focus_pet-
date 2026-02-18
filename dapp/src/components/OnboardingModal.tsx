"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Zap, Target, Sparkles, Trophy } from "lucide-react";

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
        "Set your timer and start a focus session. Your pet stays an egg until you complete your first session!",
      icon: <Target className="w-8 h-8 text-indigo-500" />,
      image: "🥚",
    },
    {
      id: 2,
      title: "Earn XP & G$",
      description:
        "Every minute of focus rewards your pet with XP and earns you GoodDollar (G$) tokens automatically.",
      icon: <Zap className="w-8 h-8 text-amber-500" />,
      image: "💎",
    },
    {
      id: 3,
      title: "Grow Your Pet",
      description:
        "Use your G$ to buy treats. Happy, well-fed pets level up faster and climb the global leaderboard!",
      icon: <Sparkles className="w-8 h-8 text-purple-500" />,
      image: "🦖",
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

              <div className="mb-4 inline-flex items-center gap-2 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                {currentStep.icon}
              </div>

              <h2 className="text-2xl font-black mb-3 tracking-tight">
                {currentStep.title}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-[280px] text-sm font-medium">
                {currentStep.description}
              </p>
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
            {step < 3 ? (
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
