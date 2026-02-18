"use client";

import React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Heart, Zap, Sparkles } from "lucide-react";

import { PetStage, PetMood, getPetEmoji, getStageName } from "@/utils/pet";

interface PetViewProps {
  stage: PetStage;
  health: number;
  xp: number;
  mood: PetMood;
}

export function PetView({ stage, health, xp, mood }: PetViewProps) {
  const [thought, setThought] = React.useState<string | null>(null);
  const [isPoked, setIsPoked] = React.useState(false);
  const [popups, setPopups] = React.useState<{ id: number; value: string }[]>(
    [],
  );
  const lastXpRef = React.useRef(xp);

  // Handle XP Popups
  React.useEffect(() => {
    if (xp > lastXpRef.current) {
      const diff = xp - lastXpRef.current;
      const id = Date.now();
      setPopups((prev) => [...prev, { id, value: `+${diff} XP` }]);
      setTimeout(() => {
        setPopups((prev) => prev.filter((p) => p.id !== id));
      }, 2000);
    }
    lastXpRef.current = xp;
  }, [xp]);

  // Handle Poke
  const handlePoke = () => {
    if (isPoked) return;
    setIsPoked(true);

    // Random poked thought
    const pokedThoughts = [
      "Hehe! 😄",
      "That tickles! ✨",
      "Rawr! 🦖",
      "Focus time? 🧠",
      "I'm awake! ⚡",
    ];
    setThought(pokedThoughts[Math.floor(Math.random() * pokedThoughts.length)]);

    setTimeout(() => setIsPoked(false), 1000);
  };

  // Contextual messages
  React.useEffect(() => {
    const getThought = () => {
      if (mood === "sleeping") return "Zzz... 😴";
      if (mood === "focused") return "Directing focus... 🧠";
      if (health < 30) return "So... hungry... 🍎";
      if (health <= 0) return "Wake me up! 💊";
      if (mood === "happy") {
        const happyThoughts = [
          "You're doing great! 🌟",
          "Let's focus together! 🦖",
          "I love this vibe! ✨",
          "XP feels so good! 💎",
        ];
        return happyThoughts[Math.floor(Math.random() * happyThoughts.length)];
      }
      return null;
    };

    if (!isPoked) {
      setThought(getThought());
    }

    // Cycle thoughts occasionally if happy
    if (mood === "happy" && !isPoked) {
      const interval = setInterval(() => {
        setThought(getThought());
      }, 8000);
      return () => clearInterval(interval);
    }
  }, [mood, health, xp, isPoked]);

  // Determine animation based on mood
  const variants: Variants = {
    happy: {
      y: [0, -12, 0],
      transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
    },
    sad: {
      rotate: [0, -4, 4, 0],
      transition: { repeat: Infinity, duration: 4 },
    },
    sleeping: {
      scale: [1, 1.03, 1],
      opacity: [0.7, 1, 0.7],
      transition: { repeat: Infinity, duration: 4 },
    },
    focused: {
      scale: [1, 1.05, 1],
      filter: [
        "brightness(1) drop-shadow(0 0 0px #6366f1)",
        "brightness(1.2) drop-shadow(0 0 20px #6366f1)",
        "brightness(1) drop-shadow(0 0 0px #6366f1)",
      ],
      transition: { repeat: Infinity, duration: 2 },
    },
    poked: {
      scale: [1, 1.4, 0.9, 1.1, 1],
      rotate: [0, 15, -15, 10, 0],
      y: [0, -40, 0],
      transition: { duration: 0.6, ease: "backOut" },
    },
  };

  // Determine Emoji/SVG based on Stage
  const getPetContent = () => {
    return <span className="text-8xl">{getPetEmoji(stage)}</span>;
  };

  // Health Color
  const healthColor = health > 50 ? "text-pink-500" : "text-red-500";

  return (
    <div className="w-full mb-8 relative">
      {/* XP Popups */}
      <AnimatePresence>
        {popups.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 1, y: -100, scale: 1.2 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute left-1/2 -translate-x-1/2 z-100 pointer-events-none"
          >
            <span className="bg-linear-to-r from-amber-400 to-amber-600 text-white px-3 py-1 rounded-full text-sm font-black shadow-lg border border-white/20">
              {p.value}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Status Bar */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 px-4 py-1.5 rounded-full shadow-lg flex items-center gap-4 text-xs font-bold text-neutral-500 z-10 w-max animate-in fade-in slide-in-from-bottom-2">
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
      <div className="w-full h-64 md:h-72 bg-neutral-50 dark:bg-neutral-900/50 rounded-[2rem] md:rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 flex items-center justify-center overflow-hidden relative group transition-all duration-500 shadow-inner">
        {/* Background Ambient Glow */}
        <div
          className={`absolute inset-0 bg-[radial-gradient(circle_at_center,var(--tw-gradient-stops))] opacity-40 blur-3xl transition-colors duration-1000
             ${
               mood === "happy"
                 ? "from-amber-200/50 to-transparent"
                 : mood === "focused"
                   ? "from-indigo-500/50 to-transparent"
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
            backgroundSize: "20px 20px",
          }}
        ></div>

        {/* Thought Bubble */}
        <AnimatePresence>
          {thought && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -10 }}
              key={thought}
              className="absolute top-12 bg-white dark:bg-neutral-800 px-4 py-2 rounded-2xl rounded-bl-sm shadow-xl border border-neutral-100 dark:border-neutral-700 z-20"
            >
              <p className="text-xs font-bold text-neutral-600 dark:text-neutral-200 whitespace-nowrap">
                {thought}
              </p>
              {/* Pointer */}
              <div className="absolute -bottom-2 left-2 w-4 h-4 bg-white dark:bg-neutral-800 border-r border-b border-neutral-100 dark:border-neutral-700 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Pet */}
        <motion.div
          animate={isPoked ? "poked" : mood}
          variants={variants}
          className="relative z-10 cursor-pointer"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePoke}
        >
          {getPetContent()}
        </motion.div>

        {/* Stage Label */}
        <div className="absolute bottom-6 flex flex-col items-center">
          <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] bg-white/50 dark:bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 dark:border-white/5 transition-all group-hover:bg-white/80 dark:group-hover:bg-black/40">
            {stage !== "egg" && stage !== "baby" && (
              <Sparkles size={12} className="text-amber-400 animate-pulse" />
            )}
            Lvl {Math.floor(xp / 100) + 1} <span className="opacity-30">•</span>{" "}
            {getStageName(stage)}
          </div>

          {/* XP Bar */}
          <div className="w-36 h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full mt-3 overflow-hidden p-0.5 border border-neutral-100/50 dark:border-neutral-700/50">
            <motion.div
              className="h-full bg-linear-to-r from-amber-400 to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${xp % 100}%` }}
              transition={{ type: "spring", stiffness: 50 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
