"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, Zap, Sparkles } from "lucide-react";

export type PetStage = "egg" | "baby" | "teen" | "adult" | "elder";
export type PetMood = "happy" | "sad" | "sleeping" | "focused";

interface PetViewProps {
  stage: PetStage;
  health: number;
  xp: number;
  mood: PetMood;
}

export function PetView({ stage, health, xp, mood }: PetViewProps) {
  // Determine animation based on mood
  const variants = {
    happy: { y: [0, -10, 0], transition: { repeat: Infinity, duration: 2 } },
    sad: {
      rotate: [0, -5, 5, 0],
      transition: { repeat: Infinity, duration: 4 },
    },
    sleeping: {
      scale: [1, 1.05, 1],
      opacity: [0.8, 1, 0.8],
      transition: { repeat: Infinity, duration: 3 },
    },
    focused: {
      scale: [1, 1.02, 1],
      filter: ["brightness(1)", "brightness(1.2)", "brightness(1)"],
      transition: { repeat: Infinity, duration: 1.5 },
    },
  };

  // Determine Emoji/SVG based on Stage
  const getPetContent = () => {
    switch (stage) {
      case "egg":
        return <span className="text-8xl">🥚</span>;
      case "baby":
        return <span className="text-8xl">🐣</span>;
      case "teen":
        return <span className="text-8xl">🦖</span>;
      case "adult":
        return <span className="text-8xl">🐉</span>;
      case "elder":
        return <span className="text-8xl">👑</span>;
    }
  };

  const getStageName = () => {
    return stage.charAt(0).toUpperCase() + stage.slice(1);
  };

  // Health Color
  const healthColor = health > 50 ? "text-pink-500" : "text-red-500";

  return (
    <div className="w-full mb-8 relative">
      {/* Status Bar */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-1.5 rounded-full shadow-sm flex items-center gap-4 text-xs font-bold text-neutral-500 z-10 w-max">
        <div className="flex items-center gap-1.5" title="Health">
          <Heart size={14} className={healthColor} fill="currentColor" />
          <span className="text-neutral-700 dark:text-neutral-300">
            {health}%
          </span>
        </div>
        <div className="w-px h-3 bg-neutral-200 dark:bg-neutral-700" />
        <div
          className="flex items-center gap-1.5 text-amber-500"
          title="Experience"
        >
          <Zap size={14} fill="currentColor" />
          <span className="text-neutral-700 dark:text-neutral-300">
            {xp} XP
          </span>
        </div>
      </div>

      {/* Main Pet Container */}
      <div className="w-full h-64 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-center overflow-hidden relative group">
        {/* Background Ambient Glow */}
        <div
          className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] opacity-40 blur-2xl transition-colors duration-1000
             ${
               mood === "happy"
                 ? "from-amber-200/50 to-transparent"
                 : mood === "focused"
                   ? "from-indigo-400/50 to-transparent"
                   : mood === "sad"
                     ? "from-blue-200/50 to-transparent"
                     : "from-indigo-900/20 to-transparent"
             }
          `}
        />

        {/* Grid Pattern */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.1]"
          style={{
            backgroundImage: "radial-gradient(#6366f1 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        ></div>

        {/* The Pet */}
        <motion.div
          animate={variants[mood]}
          className="relative z-10 cursor-pointer"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          {getPetContent()}

          {/* Mood Indicator Particles */}
          {mood === "sleeping" && (
            <motion.div
              initial={{ opacity: 0, x: 20, y: -20 }}
              animate={{ opacity: [0, 1, 0], x: 40, y: -40 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-4 -right-8 text-2xl font-bold text-indigo-300"
            >
              Zzz
            </motion.div>
          )}
        </motion.div>

        {/* Stage Label */}
        <div className="absolute bottom-4 flex flex-col items-center">
          <div className="flex items-center gap-1 text-xs font-medium text-neutral-400 uppercase tracking-widest bg-white/50 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
            {stage === "baby" || stage === "egg" ? null : (
              <Sparkles size={10} className="text-amber-400" />
            )}
            Lvl {Math.floor(xp / 100) + 1} • {getStageName()}
          </div>

          {/* XP Bar */}
          <div className="w-32 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-2 overflow-hidden">
            <motion.div
              className="h-full bg-amber-400"
              initial={{ width: 0 }}
              animate={{ width: `${xp % 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
