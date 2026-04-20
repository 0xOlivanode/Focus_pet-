"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { usePrivy } from "@privy-io/react-auth";
import { IOSInstallPrompt } from "./IOSInstallPrompt";
import { ThemeToggle } from "./ThemeToggle";

const STAGES = [
  { emoji: "🥚", label: "Egg" },
  { emoji: "🐣", label: "Baby" },
  { emoji: "🦖", label: "Teen" },
  { emoji: "🐉", label: "Adult" },
  { emoji: "👑", label: "Elder" },
];

export function AppWelcome() {
  const { login } = usePrivy();

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white flex flex-col">

      {/* Nav */}
      <header className="flex items-center justify-between px-5 sm:px-8 h-16 border-b border-neutral-100 dark:border-neutral-900">
        <div className="flex items-center gap-2">
          <img src="/focus-pet-logo.jpeg" alt="FocusPet" className="w-8 h-8 rounded-full shadow-sm" />
          <span className="font-black text-base tracking-tight">FocusPet</span>
        </div>
        <ThemeToggle />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          {/* Pet strip */}
          <div className="flex items-center justify-center gap-2 mb-10">
            {STAGES.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl
                  ${i === 0
                    ? "bg-white dark:bg-neutral-900 border-2 border-indigo-200 dark:border-indigo-800 shadow-sm"
                    : "bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800"
                  }`}
              >
                {s.emoji}
              </motion.div>
            ))}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
            Welcome to FocusPet
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm sm:text-base mb-10 leading-relaxed">
            Raise a pet by doing the work. Every focus session earns XP and{" "}
            <strong className="text-neutral-700 dark:text-neutral-200">G$</strong> on Celo.
          </p>

          <button
            onClick={() => login()}
            className="group w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Sign In to Continue
            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
          </button>

          <p className="mt-4 text-xs text-neutral-400">
            Sign in with email or any Celo wallet
          </p>
        </motion.div>
      </main>

      <IOSInstallPrompt />
    </div>
  );
}
