"use client";

import React from "react";
import { VerifiedBadge } from "./VerifiedBadge";
import { Tooltip } from "./Tooltip";
import Image from "next/image";
import {
  motion,
  AnimatePresence,
  Variants,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import {
  Heart,
  Zap,
  Sparkles,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Info,
  Waves,
  ZapOff,
} from "lucide-react";
import { useStreaming } from "@/hooks/useStreaming";
import { parseEther } from "viem";

import {
  PetStage,
  PetMood,
  getPetEmoji,
  getPetAsset,
  getStageName,
  StageInfo,
} from "@/utils/pet";

import { WeatherLayer, WeatherType } from "./WeatherLayer";

interface PetViewProps {
  stage: PetStage;
  health: number;
  xp: number;
  mood: PetMood;
  nextStageInfo?: StageInfo;
  streak?: number;
  weather?: WeatherType;
  activeCosmetic?: string;
  focusNote?: string;
  isVerified?: boolean;
}

export function PetView({
  stage,
  health,
  xp,
  mood,
  nextStageInfo,
  streak = 0,
  weather = "clear",
  activeCosmetic = "",
  focusNote = "",
  isVerified = false,
}: PetViewProps) {
  const [thought, setThought] = React.useState<string | null>(null);
  const [isPoked, setIsPoked] = React.useState(false);
  const [popups, setPopups] = React.useState<{ id: number; value: string }[]>(
    [],
  );
  const lastXpRef = React.useRef(xp);

  const { isStreaming, startSupercharge, stopSupercharge, flowRate } =
    useStreaming();

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
      if (health <= 0) return "Wake me up! 💊";
      if (mood === "focused") {
        if (focusNote) return `Working on "${focusNote}"... 🧠`;
        return "Directing focus... 🧠";
      }
      if (mood === "happy") {
        // Weather-based thoughts have priority when happy
        if (weather === "rainy" || weather === "stormy") {
          const gloomyThoughts = [
            "It's so gloomy... 🌧️",
            "A focus session would really cheer me up! 🥺",
            "I miss the sun... maybe 10 mins of focus? ☔",
            "Let's clear these clouds together! ✨",
          ];
          return gloomyThoughts[
            Math.floor(Math.random() * gloomyThoughts.length)
          ];
        }

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
  }, [mood, health, xp, isPoked, focusNote]);

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

  // Determine Emoji/SVG/Asset based on Stage
  const getPetContent = () => {
    const assetPath = getPetAsset(stage, weather);

    return (
      <div className="relative w-50 h-50 flex items-center justify-center">
        {assetPath ? (
          <Image
            src={assetPath}
            alt={getStageName(stage)}
            width={256}
            height={256}
            className={`object-contain transition-all duration-700 ${
              mood === "sleeping" ? "brightness-50 grayscale-50" : ""
            }`}
            priority
          />
        ) : (
          <span className="text-8xl">{getPetEmoji(stage)}</span>
        )}

        {/* Cosmetic Overlay Layer */}
        <AnimatePresence mode="wait">
          {activeCosmetic && (
            <motion.div
              key={activeCosmetic}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center z-20"
            >
              {activeCosmetic === "sunglasses" && (
                <div
                  className={`relative transform transition-all duration-500 ${
                    stage === "egg"
                      ? "translate-y-[-10px] scale-[0.6]"
                      : stage === "baby"
                        ? "translate-y-[-35px] scale-[1.5]"
                        : stage === "teen"
                          ? "translate-y-[-20px] scale-[0.85]"
                          : stage === "adult"
                            ? "translate-y-[-25px] scale-100"
                            : "translate-y-[-30px] scale-110"
                  }`}
                >
                  <span className="text-6xl drop-shadow-lg">🕶️</span>
                </div>
              )}
              {activeCosmetic === "crown" && (
                <div
                  className={`relative transform transition-all duration-500 ${
                    stage === "egg"
                      ? "translate-y-[-60px] scale-[0.8]"
                      : stage === "baby"
                        ? "translate-y-[-70px] scale-[0.9]"
                        : stage === "teen"
                          ? "translate-y-[-85px] scale-100"
                          : stage === "adult"
                            ? "translate-y-[-100px] scale-110"
                            : "translate-y-[-110px] scale-120"
                  }`}
                >
                  <span className="text-6xl drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                    👑
                  </span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
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
        className="w-[90%] mx-auto h-80 md:h-100 bg-white dark:bg-[#0a0a0b] rounded-4xl border border-neutral-100 dark:border-neutral-800 flex items-center justify-center relative group transition-colors duration-500 shadow-xl shadow-indigo-500/5 cursor-pointer perspective-origin-center will-change-transform"
      >
        {/* Grid Pattern (Base Layer) */}
        <div
          className="absolute inset-0 opacity-15 dark:opacity-30 rounded-4xl overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(#6366f1 1.5px, transparent 1.5px)",
            backgroundSize: "24px 24px",
            transform: "translateZ(0px)",
          }}
        ></div>

        {/* Weather Indicator Badge */}
        <div className="absolute top-4 left-4 z-50">
          <div className="group/weather relative">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/80 dark:bg-black/40 backdrop-blur-md border border-neutral-200 dark:border-white/10 shadow-sm transition-all duration-300 hover:shadow-md"
            >
              {weather === "sunny" && (
                <Sun className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
              )}
              {weather === "clear" && (
                <Sun className="w-3.5 h-3.5 text-yellow-400" />
              )}
              {weather === "cloudy" && (
                <Cloud className="w-3.5 h-3.5 text-slate-400 fill-slate-400/20" />
              )}
              {weather === "rainy" && (
                <CloudRain className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
              )}
              {weather === "stormy" && (
                <CloudLightning className="w-3.5 h-3.5 text-purple-400 fill-purple-400/20" />
              )}
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                {weather}
              </span>
              <Info className="w-3 h-3 text-neutral-400" />
            </motion.div>

            {/* Tooltip */}
            <div className="absolute top-full left-0 mt-2 w-48 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 shadow-2xl opacity-0 translate-y-2 pointer-events-none group-hover/weather:opacity-100 group-hover/weather:translate-y-0 transition-all duration-300 z-100">
              <div className="text-[11px] leading-relaxed font-medium text-neutral-600 dark:text-neutral-400">
                {weather === "sunny" || weather === "clear" ? (
                  <>
                    <span className="font-bold text-amber-500 dark:text-amber-400 block mb-1">
                      Perfect Vibe! ✨
                    </span>
                    Consistency pays off! Your consistent focus is keeping the
                    skies clear and your pet happy.
                  </>
                ) : weather === "cloudy" ? (
                  <>
                    <span className="font-bold text-slate-500 block mb-1">
                      Getting Hazy... ☁️
                    </span>
                    It's been a while since your last session. A quick focus
                    round will bring the sun back!
                  </>
                ) : (
                  <>
                    <span className="font-bold text-indigo-500 block mb-1">
                      Gloomy Days... 🌧️
                    </span>
                    Your pet misses you! Start a focus session now to clear the
                    clouds and stop the rain.
                  </>
                )}
              </div>
              {/* Tooltip Arrow */}
              <div className="absolute -top-1 left-4 w-2 h-2 bg-white dark:bg-neutral-900 border-t border-l border-neutral-100 dark:border-neutral-800 rotate-45" />
            </div>
          </div>
        </div>

        <WeatherLayer weather={weather} />
        {/* Fire Aura (Streak Effect) */}
        {streak >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.02, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-[2.5rem] border-4 border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.2)] pointer-events-none"
          />
        )}

        {/* Superfluid Aura (Streaming Effect) */}
        {isStreaming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.5, 0.8, 0.5],
              scale: [1.02, 1.05, 1.02],
              borderColor: [
                "rgba(6, 182, 212, 0.3)",
                "rgba(99, 102, 241, 0.4)",
                "rgba(6, 182, 212, 0.3)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-[2.5rem] border-[6px] shadow-[0_0_50px_rgba(6,182,212,0.3)] pointer-events-none z-10"
          />
        )}
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
          style={{ translateZ: 40, transformStyle: "preserve-3d" }}
          className="absolute top-6 left-1/2 -translate-x-1/2 bg-white/80 dark:bg-black/60 backdrop-blur-md border border-white/20 dark:border-white/10 px-4 py-2 rounded-full shadow-lg flex items-center gap-4 text-xs font-bold text-neutral-500 z-10 w-max"
        >
          <Tooltip
            content={
              <div className="flex flex-col gap-0.5">
                <span className="text-pink-500 uppercase tracking-wider">
                  Health Status
                </span>
                <span className="text-neutral-500">
                  Keep it above 0 to stay alive!
                </span>
              </div>
            }
          >
            <div className="flex items-center gap-1.5 cursor-help">
              <Heart size={14} className={healthColor} fill="currentColor" />
              <span className="text-neutral-700 dark:text-neutral-300">
                {health}%
              </span>
            </div>
          </Tooltip>
          {isVerified && (
            <>
              <div className="w-px h-3 bg-neutral-200 dark:bg-neutral-700" />
              <Tooltip
                content={
                  <div className="flex flex-col gap-0.5">
                    <span className="text-indigo-500 uppercase tracking-wider">
                      Verified Human
                    </span>
                    <span className="text-neutral-500">
                      Identity confirmed via GoodDollar.
                    </span>
                  </div>
                }
              >
                <div className="cursor-help flex items-center">
                  <VerifiedBadge size={14} />
                </div>
              </Tooltip>
            </>
          )}
          <div className="w-px h-3 bg-neutral-200 dark:bg-neutral-700" />
          <Tooltip
            content={
              <div className="flex flex-col gap-0.5">
                <span className="text-amber-500 uppercase tracking-wider">
                  Experience
                </span>
                <span className="text-neutral-500">
                  Focus to earn XP and evolve!
                </span>
              </div>
            }
          >
            <div className="flex items-center gap-1.5 text-amber-500 cursor-help">
              <Zap size={14} fill="currentColor" />
              <span className="text-neutral-700 dark:text-neutral-300">
                {xp} XP
              </span>
            </div>
          </Tooltip>

          {/* Supercharge Toggle */}
          <div className="w-px h-3 bg-neutral-200 dark:bg-neutral-700" />
          <Tooltip
            content={
              <div className="flex flex-col gap-0.5">
                <span className="text-cyan-500 uppercase tracking-wider">
                  Superfluid Streaming 🌊
                </span>
                <span className="text-neutral-500">
                  {isStreaming
                    ? "Active flow maintaining 100% happiness!"
                    : "Stream 10 G$/Mo to lock in 100% happiness & unlock the Super Aura!"}
                </span>
              </div>
            }
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                isStreaming
                  ? stopSupercharge()
                  : startSupercharge(parseEther("10"));
              }}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-all active:scale-95 ${
                isStreaming
                  ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
                  : "text-neutral-400 hover:text-cyan-500"
              }`}
            >
              {isStreaming ? (
                <>
                  <Waves size={14} className="animate-pulse" />
                  <span className="text-[10px] font-black uppercase">
                    Supercharged
                  </span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span className="text-[10px] font-black uppercase">
                    Supercharge
                  </span>
                </>
              )}
            </button>
          </Tooltip>
        </motion.div>

        {/* Background Ambient Glow (Parallax Layer 1) */}
        <motion.div
          style={{ x: bgX, y: bgY, translateZ: -60, scale: 1.5 }}
          className={`absolute inset-0 blur-[120px] opacity-40 transition-colors duration-3000 ${
            stage === "egg"
              ? "bg-indigo-300/40"
              : stage === "baby"
                ? "bg-sky-400/30"
                : stage === "teen"
                  ? "bg-blue-400/30"
                  : stage === "adult"
                    ? "bg-violet-500/20"
                    : "bg-fuchsia-600/20"
          }`}
        />

        {/* Environmental Elements (Parallax Layer 2) */}
        <motion.div
          style={{
            x: useTransform(mouseX, [-0.5, 0.5], ["-10px", "10px"]),
            y: useTransform(mouseY, [-0.5, 0.5], ["-10px", "10px"]),
            translateZ: -20,
          }}
          className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none"
        >
          {stage === "egg" && (
            <div className="w-64 h-64 border-8 border-pink-200/20 rounded-full blur-xl animate-pulse" />
          )}
          {stage === "baby" && (
            <div className="grid grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-4 h-4 bg-emerald-300 rounded-full blur-sm"
                />
              ))}
            </div>
          )}
          {stage === "teen" && (
            <div className="w-full h-1/2 mt-auto bg-linear-to-t from-blue-300/20 to-transparent blur-lg" />
          )}
          {stage === "adult" && (
            <div className="w-full h-full border-x-4 border-indigo-300/10 blur-md" />
          )}
          {stage === "elder" && (
            <div className="absolute inset-0">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.5}s`,
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>

        {/* Grid Pattern removed from here, moved to base line 215 */}

        {/* Thought Bubble (Floating closest) */}
        <AnimatePresence>
          {thought && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10, z: 80 }}
              animate={{ opacity: 1, scale: 1, y: 0, z: 80 }}
              exit={{ opacity: 0, scale: 0.8, y: -10, z: 80 }}
              key={thought}
              style={{ translateZ: 80 }}
              className="absolute top-20 bg-white dark:bg-neutral-800 px-4 py-2 rounded-2xl rounded-bl-sm shadow-xl border border-neutral-100 dark:border-neutral-700 z-20"
            >
              <p className="text-xs/[100%] font-bold text-neutral-600 dark:text-neutral-200 whitespace-nowrap">
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
