"use client";

import React from "react";
import {
  motion,
  AnimatePresence,
  Variants,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import { Heart, Zap, Sparkles } from "lucide-react";

import {
  PetStage,
  PetMood,
  getPetEmoji,
  getStageName,
  StageInfo,
} from "@/utils/pet";

interface PetViewProps {
  stage: PetStage;
  health: number;
  xp: number;
  mood: PetMood;
  nextStageInfo?: StageInfo;
}

export function PetView({
  stage,
  health,
  xp,
  mood,
  nextStageInfo,
}: PetViewProps) {
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

  // 3D Tilt Logic
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-15deg", "15deg"]);

  // Parallax for inner elements
  const petZ = useTransform(mouseY, [-0.5, 0.5], ["60px", "60px"]);
  const bgX = useTransform(mouseX, [-0.5, 0.5], ["-20px", "20px"]);
  const bgY = useTransform(mouseY, [-0.5, 0.5], ["-20px", "20px"]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = event.clientX - rect.left;
    const mouseYPos = event.clientY - rect.top;
    const xPct = mouseXPos / width - 0.5;
    const yPct = mouseYPos / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return (
    <div className="w-full mb-8 relative perspective-1000">
      {/* XP Popups */}
      <AnimatePresence>
        {popups.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 0, scale: 0.5, z: 100 }}
            animate={{ opacity: 1, y: -100, scale: 1.2, z: 100 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute left-1/2 -translate-x-1/2 z-100 pointer-events-none"
            style={{ translateZ: 100 }}
          >
            <span className="bg-linear-to-r from-amber-400 to-amber-600 text-white px-3 py-1 rounded-full text-sm font-black shadow-lg border border-white/20">
              {p.value}
            </span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Main Pet Container (3D Card) */}
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-80 md:h-96 bg-neutral-50 dark:bg-neutral-900/50 rounded-[2.5rem] border border-neutral-100 dark:border-neutral-800 flex items-center justify-center relative group transition-colors duration-500 shadow-xl shadow-indigo-500/5 cursor-pointer perspective-origin-center will-change-transform"
      >
        {/* Shine / Glare Effect */}
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none z-50">
          <motion.div
            className="absolute inset-0 bg-linear-to-tr from-transparent via-white/10 to-transparent"
            style={{
              x: useTransform(mouseX, [-0.5, 0.5], ["-100%", "100%"]),
              opacity: useTransform(mouseY, [-0.5, 0.5], [0, 0.3]),
            }}
          />
        </div>

        {/* Floating Status Bar */}
        <motion.div
          style={{ translateZ: 40 }}
          className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-black/60 backdrop-blur-md border border-white/20 dark:border-white/10 px-4 py-2 rounded-full shadow-lg flex items-center gap-4 text-xs font-bold text-neutral-500 z-10 w-max"
        >
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
        </motion.div>

        {/* Background Ambient Glow (Parallax) */}
        <motion.div
          style={{ x: bgX, y: bgY, translateZ: -20, scale: 1.1 }}
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

        {/* Grid Pattern (Base Layer) */}
        <div
          className="absolute inset-0 opacity-[0.1] dark:opacity-[0.1] rounded-[2.5rem] overflow-hidden"
          style={{
            backgroundImage: "radial-gradient(#6366f1 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            transform: "translateZ(0px)",
          }}
        ></div>

        {/* Thought Bubble (Floating closest) */}
        <AnimatePresence>
          {thought && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10, z: 80 }}
              animate={{ opacity: 1, scale: 1, y: 0, z: 80 }}
              exit={{ opacity: 0, scale: 0.8, y: -10, z: 80 }}
              key={thought}
              style={{ translateZ: 80 }}
              className="absolute top-16 bg-white dark:bg-neutral-800 px-4 py-2 rounded-2xl rounded-bl-sm shadow-xl border border-neutral-100 dark:border-neutral-700 z-20"
            >
              <p className="text-xs font-bold text-neutral-600 dark:text-neutral-200 whitespace-nowrap">
                {thought}
              </p>
              {/* Pointer */}
              <div className="absolute -bottom-2 left-2 w-4 h-4 bg-white dark:bg-neutral-800 border-r border-b border-neutral-100 dark:border-neutral-700 rotate-45" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Pet (Floating) */}
        <motion.div
          animate={isPoked ? "poked" : mood}
          variants={variants}
          style={{ translateZ: petZ }}
          className="relative z-10 cursor-pointer drop-shadow-2xl"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePoke}
        >
          {getPetContent()}
        </motion.div>

        {/* Stage Label & Evolution Bar (Floating) */}
        <motion.div
          style={{ translateZ: 30 }}
          className="absolute bottom-8 flex flex-col items-center w-full px-8"
        >
          <div className="flex items-center gap-2 text-[10px] font-black text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.2em] bg-white/50 dark:bg-black/20 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20 dark:border-white/5 transition-all group-hover:bg-white/80 dark:group-hover:bg-black/40 mb-3 shadow-lg">
            {stage !== "egg" && stage !== "baby" && (
              <Sparkles size={12} className="text-amber-400 animate-pulse" />
            )}
            Lvl {Math.floor(xp / 100) + 1} <span className="opacity-30">•</span>{" "}
            {getStageName(stage)}
          </div>

          {/* XP / Evolution Bar */}
          {nextStageInfo && nextStageInfo.nextStage !== "none" && (
            <div className="w-full max-w-[160px] relative group/bar cursor-help">
              <div className="h-2.5 w-full bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden border border-neutral-100/50 dark:border-neutral-700/50 shadow-inner">
                <motion.div
                  className="h-full bg-linear-to-r from-amber-400 to-amber-500 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(nextStageInfo.progress, 2)}%` }}
                  transition={{ type: "spring", stiffness: 50 }}
                />
              </div>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-neutral-900 dark:bg-neutral-800 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-xl z-50 border border-white/10">
                {nextStageInfo.remaining}m more until{" "}
                {getStageName(nextStageInfo.nextStage as PetStage)} evolution
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-neutral-900 dark:border-t-neutral-800" />
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
