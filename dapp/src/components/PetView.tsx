"use client";

import React from "react";
import { VerifiedBadge } from "./VerifiedBadge";
import { Tooltip } from "./Tooltip";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Heart,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  ZapOff,
  Moon,
} from "lucide-react";
import { useStreaming } from "@/hooks/useStreaming";
import { SuperchargeModal } from "./SuperchargeModal";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

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
  equippedCosmetics?: Record<string, boolean>;
  focusNote?: string;
  isVerified?: boolean;
  isNight?: boolean;
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
  equippedCosmetics = {},
  focusNote = "",
  isVerified = false,
  isNight = false,
}: PetViewProps) {
  const [thought, setThought] = React.useState<string | null>(null);
  const [isPoked, setIsPoked] = React.useState(false);
  const [popups, setPopups] = React.useState<{ id: number; value: string }[]>(
    [],
  );
  const lastXpRef = React.useRef(xp);

  const { isStreaming, startSupercharge, stopSupercharge, flowRate } =
    useStreaming();
  const [superchargeModalOpen, setSuperchargeModalOpen] = React.useState(false);

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
      if (mood === "sad") {
        const sadThoughts = [
          "Hey! Where did you go? 🥺",
          "Focus lost... I'm sad now. 💔",
          "I missed you... and my health hurts. 😿",
          "Stay with me next time? 🥺",
        ];
        return sadThoughts[Math.floor(Math.random() * sadThoughts.length)];
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
      filter: "brightness(1) drop-shadow(0 0 0px transparent)",
      transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
    },
    sad: {
      rotate: [0, -4, 4, 0],
      y: health <= 0 ? [0, 10, 0] : 0,
      filter: "brightness(1) drop-shadow(0 0 0px transparent)",
      transition: { repeat: Infinity, duration: 4 },
    },
    sleeping: {
      scale: [1, 1.03, 1],
      opacity: [0.7, 1, 0.7],
      filter: "brightness(1) drop-shadow(0 0 0px transparent)",
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
      <div className="relative w-100 h-100 flex items-center justify-center">
        {assetPath ? (
          <Image
            src={assetPath}
            alt={getStageName(stage)}
            width={256}
            height={256}
            className={cn(
              "object-contain transition-all duration-700",
              mood === "sleeping" && "brightness-50 grayscale-50",
              health <= 0 && "grayscale brightness-50 blur-[2px]",
            )}
            priority
          />
        ) : (
          <span
            className={cn("text-8xl", health <= 0 && "grayscale opacity-50")}
          >
            {getPetEmoji(stage)}
          </span>
        )}

        {/* Death Overlay */}
        {health <= 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
              animate={{
                opacity: [0.7, 1, 0.7],
                scale: [1, 1.1, 1],
                rotate: [-5, 5, -5],
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="flex flex-col items-center gap-2"
            >
              <div className="bg-red-500/20 backdrop-blur-md p-6 rounded-full border-2 border-red-500/50 shadow-[0_0_40px_rgba(239,68,68,0.4)]">
                <ZapOff
                  size={48}
                  className="text-red-500 drop-shadow-lg"
                  strokeWidth={3}
                />
              </div>
              {/* <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em] bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                Sync & Revive
              </span> */}
            </motion.div>
          </div>
        )}

        {/* Low Health Warning Border */}
        {health > 0 && health < 30 && (
          <motion.div
            className="absolute inset-0 rounded-full pointer-events-none z-25"
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            style={{
              boxShadow:
                "0 0 0 3px rgba(239,68,68,0.7), 0 0 24px 4px rgba(239,68,68,0.3)",
            }}
          />
        )}

        {/* Cosmetic Overlay Layer (Multi-Slot Wardrobe) */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <AnimatePresence>
            {equippedCosmetics.sunglasses && (
              <motion.div
                key="sunglasses"
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute transform transition-all duration-500 ${
                  stage === "egg"
                    ? "translate-y-[-20px] scale-[1.5]"
                    : stage === "baby"
                      ? "translate-y-[-43px] scale-[1.8]"
                      : stage === "teen"
                        ? "translate-y-[-20px] scale-[0.85]"
                        : stage === "adult"
                          ? "translate-y-[-57px] translate-x-[-63px] scale-80"
                          : "translate-y-[-30px] scale-110"
                }`}
              >
                <img src="/assets/shop/cool-shades.png" alt="sunglasses" className="w-16 h-16 object-contain drop-shadow-lg" />
              </motion.div>
            )}
            {equippedCosmetics.crown && (
              <motion.div
                key="crown"
                initial={{ opacity: 0, scale: 0.5, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`absolute transform transition-all duration-500 ${
                  stage === "egg"
                    ? "translate-y-[-85px] scale-[1]"
                    : stage === "baby"
                      ? "translate-y-[-100px] scale-[0.9]"
                      : stage === "teen"
                        ? "translate-y-[-85px] scale-100"
                        : stage === "adult"
                          ? "translate-y-[-92px] translate-x-[-50px] scale-75"
                          : "translate-y-[-110px] scale-120"
                } ${isNight ? "brightness-[0.7] contrast-[1.1] drop-shadow-[0_0_15px_rgba(165,180,252,0.4)]" : ""}`}
              >
                <img src="/assets/shop/crown.png" alt="crown" className="w-16 h-16 object-contain drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // Health Color
  const healthColor = health > 50 ? "text-pink-500" : "text-red-500";

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

      {/* Gradient border wrapper */}
      <div
        className="w-full rounded-[2rem]"
        style={{
          padding: "0.5px",
          background:
            "linear-gradient(180deg, #FFFFFF 0%, #000000 24.09%, #000000 77.59%, #999999 100%)",
        }}
      >
        {/* Main Pet Container */}
        <motion.div className="w-full h-80 md:h-[483px] bg-[#000000] rounded-[calc(2rem-0.5px)] flex items-center justify-center relative group transition-colors duration-500 shadow-xl cursor-pointer">
          {/* Weather Layer */}
          <WeatherLayer weather={weather} isNight={isNight} />

          {/* Weather Badge */}
          {(() => {
            const badge: Record<WeatherType, { icon: React.ReactNode; label: string } | null> = {
              sunny:   { icon: <Sun size={11} />,           label: "Sunny" },
              clear:   null,
              cloudy:  { icon: <Cloud size={11} />,         label: "Cloudy" },
              rainy:   { icon: <CloudRain size={11} />,     label: "Rainy" },
              stormy:  { icon: <CloudLightning size={11} />, label: "Stormy" },
            };
            const nightBadge = isNight ? { icon: <Moon size={11} />, label: "Night" } : null;
            const b = nightBadge ?? badge[weather];
            if (!b) return null;
            return (
              <div className="absolute top-4 left-4 z-20 flex items-center gap-1.5 px-2.5 py-1.5 bg-black/60 border border-neutral-800/80 rounded-full backdrop-blur-sm pointer-events-none">
                <span className="text-neutral-400">{b.icon}</span>
                <span className="text-[10px] text-neutral-400 font-medium tracking-wide">{b.label}</span>
              </div>
            );
          })()}

          {/* Night Aura (Moonlight Effect) */}
          {/* {isNight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="absolute inset-0 rounded-[2.5rem] border-2 border-indigo-400/20 shadow-[inset_0_0_50px_rgba(129,140,248,0.15)] pointer-events-none"
          />
        )} */}
          {/* Fire Aura (Streak Effect) */}
          {/* {streak >= 3 && (
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
        )} */}

          {/* Superfluid Aura (Streaming Effect) */}
          {/* {isStreaming &&
          (() => {
            const monthlyAmount = Number(
              formatEther(calculateMonthlyAmount(flowRate)),
            );
            const isMax = monthlyAmount > 75;
            const isPower = monthlyAmount > 25 && monthlyAmount <= 75;

            return (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: isMax
                      ? [0.6, 0.9, 0.6]
                      : isPower
                        ? [0.5, 0.8, 0.5]
                        : [0.3, 0.5, 0.3],
                    scale: isMax
                      ? [1.03, 1.08, 1.03]
                      : isPower
                        ? [1.02, 1.05, 1.02]
                        : [1.01, 1.03, 1.01],
                    borderColor: isMax
                      ? [
                          "rgba(99, 102, 241, 0.5)",
                          "rgba(168, 85, 247, 0.6)",
                          "rgba(99, 102, 241, 0.5)",
                        ]
                      : isPower
                        ? [
                            "rgba(6, 182, 212, 0.4)",
                            "rgba(99, 102, 241, 0.5)",
                            "rgba(6, 182, 212, 0.4)",
                          ]
                        : [
                            "rgba(16, 185, 129, 0.3)",
                            "rgba(6, 182, 212, 0.4)",
                            "rgba(16, 185, 129, 0.3)",
                          ],
                  }}
                  transition={{
                    duration: isMax ? 1.5 : isPower ? 2 : 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className={`absolute inset-0 rounded-[2.5rem] border-[6px] pointer-events-none z-10 ${
                    isMax
                      ? "shadow-[0_0_60px_rgba(99,102,241,0.4)]"
                      : isPower
                        ? "shadow-[0_0_40px_rgba(6,182,212,0.3)]"
                        : "shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                  }`}
                />

                {isMax && (
                  <motion.div
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{
                      opacity: [0, 0.4, 0],
                      scale: [1, 1.15],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                    className="absolute inset-0 rounded-[2.5rem] border-2 border-indigo-500/30 pointer-events-none z-0"
                  />
                )}
              </>
            );
          })()} */}
          {/* <motion.div
          style={{ translateZ: 40, transformStyle: "preserve-3d" }}
          className="absolute top-4 sm:top-6 left-1/2 -translate-x-1/2 bg-neutral-900/80 backdrop-blur-md border border-neutral-800 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center justify-center gap-2 sm:gap-1.5 text-[10px] sm:text-xs font-bold text-neutral-500 z-10 w-fit sm:w-fit max-w-[320px] sm:max-w-none whitespace-nowrap"
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
              <span className="text-neutral-300">
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
          <div className="w-px h-3 bg-neutral-700" />
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
            <div className="flex items-center gap-1 sm:gap-1.5 text-amber-500 cursor-help">
              <Zap
                size={14}
                fill="currentColor"
                className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5"
              />
              <span className="text-neutral-300">
                {xp} <span className="hidden sm:inline">XP</span>
              </span>
            </div>
          </Tooltip>

          <div className="w-px h-3 bg-neutral-700" />
          <Tooltip
            content={
              <div className="flex flex-col gap-0.5 max-w-[150px]">
                <span className="text-cyan-500 uppercase tracking-wider">
                  Supercharge ⚡️
                </span>
                <span className="text-neutral-500">
                  Stream G$ to reach "God Mode": 100% Health & XP Multipliers.
                </span>
              </div>
            }
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSuperchargeModalOpen(true);
              }}
              className={`flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-full transition-all active:scale-95 cursor-help ${
                isStreaming
                  ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
                  : "text-neutral-400 hover:text-cyan-500"
              }`}
            >
              {isStreaming ? (
                <>
                  <Waves
                    size={14}
                    className="animate-pulse w-3.5 h-3.5 sm:w-3.5 sm:h-3.5"
                  />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase">
                    <span className="hidden sm:inline">Supercharged</span>
                    <span className="sm:hidden">Active</span>
                  </span>
                </>
              ) : (
                <>
                  <Zap size={14} className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase">
                    <span className="hidden sm:inline">Supercharge</span>
                    <span className="sm:hidden">Boost</span>
                  </span>
                </>
              )}
            </button>
          </Tooltip>
        </motion.div> */}

          {/* Supercharge Modal */}
          <SuperchargeModal
            isOpen={superchargeModalOpen}
            onClose={() => setSuperchargeModalOpen(false)}
            isStreaming={isStreaming}
            onStart={startSupercharge}
            onStop={stopSupercharge}
          />

          {/* Thought Bubble */}
          <AnimatePresence>
            {thought && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                key={thought}
                className="absolute top-20 bg-[#1a1a1a] px-4 py-2 rounded-2xl rounded-bl-sm shadow-xl border border-neutral-800 z-20"
              >
                <p className="text-xs/[100%] font-bold text-neutral-200 whitespace-nowrap">
                  {thought}
                </p>
                {/* Pointer */}
                <div className="absolute -bottom-2 left-2 w-4 h-4 bg-[#1a1a1a] border-r border-b border-neutral-800 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* The Pet (Floating) */}
          <motion.div
            animate={isPoked ? "poked" : mood}
            variants={variants}
            className="relative z-10 cursor-pointer drop-shadow-2xl"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handlePoke}
          >
            {getPetContent()}
          </motion.div>
        </motion.div>
      </div>
      {/* end gradient border wrapper */}

      {/* Low Health Warning Banner */}
      {health > 0 && health < 30 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-[90%] mx-auto mt-3 flex items-center justify-between gap-3 px-4 py-3 bg-red-950/30 border border-red-800/50 rounded-2xl"
        >
          <div className="flex items-center gap-2.5">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
            >
              <Heart size={16} className="text-red-500" fill="currentColor" />
            </motion.div>
            <span className="text-xs font-black text-red-400">
              Your pet is struggling! ({health}% health)
            </span>
          </div>
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide whitespace-nowrap">
            Feed it now →
          </span>
        </motion.div>
      )}
    </div>
  );
}
