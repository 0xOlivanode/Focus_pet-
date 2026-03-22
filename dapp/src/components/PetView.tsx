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
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Waves,
  ZapOff,
  Moon,
} from "lucide-react";
import { useStreaming } from "@/hooks/useStreaming";
import { formatEther } from "viem";
import { SuperchargeModal } from "./SuperchargeModal";
import { calculateMonthlyAmount } from "@/lib/superfluid";

import {
  PetStage,
  PetMood,
  getPetEmoji,
  getPetAsset,
  getStageName,
  StageInfo,
} from "@/utils/pet";

import { WeatherLayer, WeatherType } from "./WeatherLayer";

const FD = "var(--font-syne), var(--font-geist-sans)";

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
  const [popups, setPopups] = React.useState<{ id: number; value: string }[]>([]);
  const lastXpRef = React.useRef(xp);

  const { isStreaming, startSupercharge, stopSupercharge, flowRate } = useStreaming();
  const [superchargeModalOpen, setSuperchargeModalOpen] = React.useState(false);

  // XP popup on gain
  React.useEffect(() => {
    if (xp > lastXpRef.current) {
      const diff = xp - lastXpRef.current;
      const id = Date.now();
      setPopups((prev) => [...prev, { id, value: `+${diff} XP` }]);
      setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== id)), 2000);
    }
    lastXpRef.current = xp;
  }, [xp]);

  // Poke
  const handlePoke = () => {
    if (isPoked) return;
    setIsPoked(true);
    const pokedThoughts = ["Hehe! 😄", "That tickles!", "Rawr! 🦖", "Focus time? 🧠", "I'm awake! ⚡"];
    setThought(pokedThoughts[Math.floor(Math.random() * pokedThoughts.length)]);
    setTimeout(() => setIsPoked(false), 1000);
  };

  // Contextual thoughts
  React.useEffect(() => {
    const getThought = () => {
      if (mood === "sleeping") return "Zzz... 😴";
      if (health <= 0) return "Wake me up! 💊";
      if (mood === "focused") return focusNote ? `"${focusNote}" 🧠` : "Directing focus... 🧠";
      if (mood === "happy") {
        if (weather === "rainy" || weather === "stormy") {
          const g = ["It's so gloomy... 🌧️", "Focus would cheer me up! 🥺", "Let's clear these clouds! ✨"];
          return g[Math.floor(Math.random() * g.length)];
        }
        const h = ["You're doing great! 🌟", "Let's focus together! 🦖", "XP feels so good! 💎"];
        return h[Math.floor(Math.random() * h.length)];
      }
      if (mood === "sad") {
        const s = ["Hey! Where did you go? 🥺", "Stay with me next time? 🥺", "I missed you... 😿"];
        return s[Math.floor(Math.random() * s.length)];
      }
      return null;
    };
    if (!isPoked) setThought(getThought());
    if (mood === "happy" && !isPoked) {
      const interval = setInterval(() => setThought(getThought()), 8000);
      return () => clearInterval(interval);
    }
  }, [mood, health, xp, isPoked, focusNote, weather]);

  // Pet animation variants
  const variants: Variants = {
    happy:    { y: [0, -12, 0], transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" } },
    sad:      { rotate: [0, -4, 4, 0], y: health <= 0 ? [0, 10, 0] : 0, transition: { repeat: Infinity, duration: 4 } },
    sleeping: { scale: [1, 1.03, 1], opacity: [0.7, 1, 0.7], transition: { repeat: Infinity, duration: 4 } },
    focused:  {
      scale: [1, 1.05, 1],
      filter: ["brightness(1) drop-shadow(0 0 0px #E05C28)", "brightness(1.15) drop-shadow(0 0 20px #E05C28)", "brightness(1) drop-shadow(0 0 0px #E05C28)"],
      transition: { repeat: Infinity, duration: 2 },
    },
    poked: { scale: [1, 1.4, 0.9, 1.1, 1], rotate: [0, 15, -15, 10, 0], y: [0, -40, 0], transition: { duration: 0.6, ease: "backOut" } },
  };

  // Pet image/emoji
  const getPetContent = () => {
    const assetPath = getPetAsset(stage, weather);
    return (
      <div style={{ position: "relative", width: 200, height: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {assetPath ? (
          <Image
            src={assetPath}
            alt={getStageName(stage)}
            width={200}
            height={200}
            style={{
              objectFit: "contain",
              filter: mood === "sleeping" ? "brightness(0.5) grayscale(0.5)" : health <= 0 ? "grayscale(1) brightness(0.5) blur(2px)" : undefined,
              transition: "filter 0.7s",
            }}
            priority
          />
        ) : (
          <span style={{ fontSize: 80, filter: health <= 0 ? "grayscale(1) opacity(0.5)" : undefined }}>
            {getPetEmoji(stage)}
          </span>
        )}

        {/* Death overlay */}
        {health <= 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 30, pointerEvents: "none" }}>
            <motion.div
              animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.1, 1], rotate: [-5, 5, -5] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <div style={{ background: "rgba(220,38,38,0.2)", backdropFilter: "blur(4px)", padding: 20, borderRadius: "50%", border: "2px solid rgba(220,38,38,0.5)", boxShadow: "0 0 40px rgba(220,38,38,0.4)" }}>
                <ZapOff size={40} color="#EF4444" strokeWidth={3} />
              </div>
            </motion.div>
          </div>
        )}

        {/* Cosmetics */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
          <AnimatePresence>
            {equippedCosmetics.sunglasses && (
              <motion.div
                key="sunglasses"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  position: "absolute",
                  transform: stage === "egg" ? "translateY(-20px) scale(1.5)" : stage === "baby" ? "translateY(-35px) scale(1.5)" : stage === "teen" ? "translateY(-20px) scale(0.85)" : stage === "adult" ? "translateY(-57px) translateX(-63px) scale(0.8)" : "translateY(-30px) scale(1.1)",
                }}
              >
                <span style={{ fontSize: 48, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>🕶️</span>
              </motion.div>
            )}
            {equippedCosmetics.crown && (
              <motion.div
                key="crown"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{
                  position: "absolute",
                  transform: stage === "egg" ? "translateY(-85px) scale(1)" : stage === "baby" ? "translateY(-90px) scale(0.9)" : stage === "teen" ? "translateY(-85px)" : stage === "adult" ? "translateY(-92px) translateX(-50px) scale(0.75)" : "translateY(-110px) scale(1.2)",
                }}
              >
                <span style={{ fontSize: 48, filter: "drop-shadow(0 0 15px rgba(251,191,36,0.5))" }}>👑</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // 3D tilt
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 150, damping: 20 });
  const smy = useSpring(my, { stiffness: 150, damping: 20 });
  const rotateX = useTransform(smy, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(smx, [-0.5, 0.5], ["-8deg", "8deg"]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (typeof window !== "undefined" && window.innerWidth < 768) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  }
  function handleMouseLeave() {
    mx.set(0);
    my.set(0);
  }

  // Weather display
  const weatherIcon = () => {
    if (weather === "sunny" || weather === "clear") return isNight ? <Moon size={13} color="#818CF8" /> : <Sun size={13} color="#F59E0B" />;
    if (weather === "cloudy") return <Cloud size={13} color="#94A3B8" />;
    if (weather === "rainy") return <CloudRain size={13} color="#818CF8" />;
    if (weather === "stormy") return <CloudLightning size={13} color="#A78BFA" />;
    return <Sun size={13} color="#F59E0B" />;
  };
  const weatherLabel = isNight && (weather === "sunny" || weather === "clear") ? "Moonlight" : (weather || "clear");
  const weatherTooltip = weather === "sunny" || weather === "clear"
    ? "Perfect vibe! Your consistent focus is keeping the skies clear."
    : weather === "cloudy"
    ? "Getting hazy. A quick session will bring the sun back!"
    : "Your pet misses you! Focus to clear the clouds.";

  // Supercharge info
  const monthlyAmount = isStreaming && flowRate ? Number(formatEther(calculateMonthlyAmount(flowRate))) : 0;
  const isMax = monthlyAmount > 75;
  const isPower = monthlyAmount > 25 && monthlyAmount <= 75;
  const streamingAuraColor = isMax ? "rgba(99,102,241,0.5)" : isPower ? "rgba(6,182,212,0.4)" : "rgba(16,185,129,0.3)";
  const streamingGlow = isMax ? "0 0 60px rgba(99,102,241,0.35)" : isPower ? "0 0 40px rgba(6,182,212,0.25)" : "0 0 20px rgba(16,185,129,0.2)";

  // Health colour
  const healthColor = health <= 0 ? "#EF4444" : health <= 30 ? "#F97316" : health <= 60 ? "#FB923C" : "#F472B6";

  // Level
  const level = Math.floor(xp / 3600) + 1;

  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", perspective: "1000px" }}>
      {/* XP popups */}
      <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
        <AnimatePresence>
          {popups.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 0, scale: 0.6 }}
              animate={{ opacity: 1, y: -80, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0.8 }}
              style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", zIndex: 100, pointerEvents: "none", top: 0 }}
            >
              <span style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", color: "#fff", padding: "4px 12px", borderRadius: 99, fontSize: 13, fontWeight: 800, boxShadow: "0 4px 12px rgba(245,158,11,0.4)" }}>
                {p.value}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* 3D Card */}
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX, rotateY,
            transformStyle: "preserve-3d",
            background: "#1C1A16",
            borderRadius: 24,
            border: health <= 0 ? "1px solid rgba(220,38,38,0.4)" : "1px solid #2C2A26",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            cursor: "pointer",
            boxShadow: health <= 0 ? "0 0 30px rgba(220,38,38,0.15)" : "none",
          }}
        >
          {/* Auras */}
          {isNight && (
            <motion.div
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "absolute", inset: 0, borderRadius: 24, border: "2px solid rgba(129,140,248,0.2)", boxShadow: "inset 0 0 50px rgba(129,140,248,0.1)", pointerEvents: "none", zIndex: 5 }}
            />
          )}
          {streak >= 3 && (
            <motion.div
              animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.02, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "absolute", inset: 0, borderRadius: 24, border: "3px solid rgba(249,115,22,0.3)", boxShadow: "0 0 40px rgba(249,115,22,0.15)", pointerEvents: "none", zIndex: 5 }}
            />
          )}
          {isStreaming && (
            <motion.div
              animate={{ opacity: isMax ? [0.6, 0.9, 0.6] : isPower ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3], borderColor: [streamingAuraColor, streamingAuraColor, streamingAuraColor] }}
              transition={{ duration: isMax ? 1.5 : 2, repeat: Infinity }}
              style={{ position: "absolute", inset: 0, borderRadius: 24, border: `4px solid ${streamingAuraColor}`, boxShadow: streamingGlow, pointerEvents: "none", zIndex: 5 }}
            />
          )}

          {/* Ambient glow behind pet */}
          <div style={{
            position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)",
            width: 260, height: 260, borderRadius: "50%",
            background: mood === "focused"
              ? "radial-gradient(circle, rgba(224,92,40,0.12) 0%, transparent 70%)"
              : stage === "elder"
                ? "radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)"
                : stage === "adult"
                  ? "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)"
                  : "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
            pointerEvents: "none", zIndex: 1,
            transition: "background 1s",
          }} />

          {/* Weather layer */}
          <WeatherLayer weather={weather} isNight={isNight} />

          {/* ── Header strip ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", position: "relative", zIndex: 20, flexShrink: 0 }}>
            {/* Weather badge with tooltip */}
            <Tooltip
              content={
                <div style={{ maxWidth: 160 }}>
                  <div style={{ color: isNight ? "#818CF8" : "#F59E0B", fontWeight: 800, textTransform: "uppercase", fontSize: 9, letterSpacing: "0.1em", marginBottom: 3 }}>
                    {weatherLabel}
                  </div>
                  <div style={{ color: "#9CA3AF", fontSize: 10 }}>{weatherTooltip}</div>
                </div>
              }
              position="bottom"
            >
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "5px 10px", borderRadius: 99,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                cursor: "help",
              }}>
                {weatherIcon()}
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9CA3AF" }}>
                  {weatherLabel}
                </span>
              </div>
            </Tooltip>

            {/* Right: verified + supercharge indicator */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isStreaming && (
                <Tooltip content={<span style={{ color: "#06B6D4" }}>Supercharge active — boosting XP & health!</span>} position="bottom">
                  <motion.div
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 99, background: "rgba(6,182,212,0.12)", border: "1px solid rgba(6,182,212,0.3)", cursor: "help" }}
                  >
                    <Waves size={11} color="#06B6D4" />
                    <span style={{ fontSize: 9, fontWeight: 800, color: "#06B6D4", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                      {isMax ? "God Mode" : "Supercharged"}
                    </span>
                  </motion.div>
                </Tooltip>
              )}
              {isVerified && (
                <Tooltip content={<span style={{ color: "#818CF8" }}>Verified human via GoodDollar</span>} position="bottom">
                  <div style={{ cursor: "help" }}>
                    <VerifiedBadge size={14} />
                  </div>
                </Tooltip>
              )}
            </div>
          </div>

          {/* ── Pet area ── */}
          <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, minHeight: 0, overflow: "hidden" }}>
            {/* Thought bubble */}
            <AnimatePresence>
              {thought && (
                <motion.div
                  key={thought}
                  initial={{ opacity: 0, scale: 0.8, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: -8 }}
                  style={{
                    position: "absolute", top: 8, zIndex: 30,
                    background: "#FAF7F2", borderRadius: "16px 16px 16px 4px",
                    padding: "7px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                    pointerEvents: "none",
                  }}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: "#1C1A16", whiteSpace: "nowrap" }}>
                    {thought}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* The pet */}
            <motion.div
              animate={isPoked ? "poked" : mood}
              variants={variants}
              style={{ position: "relative", zIndex: 10, filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.4))" }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePoke}
            >
              {getPetContent()}
            </motion.div>
          </div>

          {/* ── Stage + XP bar ── */}
          <div style={{ padding: "12px 18px 10px", position: "relative", zIndex: 20, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", color: "#FAF7F2" }}>
                Lvl {level} <span style={{ color: "#3A3530" }}>·</span> {getStageName(stage)}
              </span>
              {nextStageInfo && nextStageInfo.nextStage !== "none" && (
                <Tooltip
                  content={
                    <span>
                      {nextStageInfo.remaining >= 60
                        ? `${Math.ceil(nextStageInfo.remaining / 60)}m`
                        : `${nextStageInfo.remaining}s`}{" "}
                      to {getStageName(nextStageInfo.nextStage as PetStage)}
                    </span>
                  }
                  position="top"
                >
                  <span style={{ fontSize: 10, color: "#5A5450", cursor: "help" }}>
                    {nextStageInfo.progress.toFixed(0)}%
                  </span>
                </Tooltip>
              )}
            </div>

            {nextStageInfo && nextStageInfo.nextStage !== "none" && (
              <Tooltip
                content={
                  <span>
                    {nextStageInfo.remaining >= 60
                      ? `${Math.ceil(nextStageInfo.remaining / 60)}m`
                      : `${nextStageInfo.remaining}s`}{" "}
                    until {getStageName(nextStageInfo.nextStage as PetStage)} evolution
                  </span>
                }
                position="top"
              >
                <div style={{ height: 5, background: "#2C2A26", borderRadius: 99, overflow: "hidden", cursor: "help" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(nextStageInfo.progress, 1.5)}%` }}
                    transition={{ type: "spring", stiffness: 50 }}
                    style={{ height: "100%", background: "linear-gradient(to right, #E05C28, #F59E0B)", borderRadius: 99, boxShadow: "0 0 8px rgba(224,92,40,0.4)" }}
                  />
                </div>
              </Tooltip>
            )}
          </div>

          {/* ── Stats bar ── */}
          <div style={{ borderTop: "1px solid #2C2A26", display: "flex", flexShrink: 0, position: "relative", zIndex: 20 }}>
            {/* Health */}
            <Tooltip
              content={
                <div>
                  <div style={{ color: healthColor, fontWeight: 800, textTransform: "uppercase", fontSize: 9, letterSpacing: "0.1em", marginBottom: 2 }}>Health</div>
                  <div style={{ color: "#9CA3AF", fontSize: 10 }}>
                    {health <= 0 ? "Pet is fainted — revive it from the shop!" : health <= 30 ? "Critical! Feed your pet soon." : "Keep focusing to keep health up."}
                  </div>
                </div>
              }
              position="top"
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 8px", cursor: "help", gap: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#5A5450" }}>Health</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Heart size={13} color={healthColor} fill={healthColor} />
                  <span style={{ fontFamily: FD, fontWeight: 800, fontSize: 16, color: "#FAF7F2", letterSpacing: "-0.02em" }}>{health}%</span>
                </div>
              </div>
            </Tooltip>

            <div style={{ width: 1, background: "#2C2A26", flexShrink: 0 }} />

            {/* XP */}
            <Tooltip
              content={
                <div>
                  <div style={{ color: "#F59E0B", fontWeight: 800, textTransform: "uppercase", fontSize: 9, letterSpacing: "0.1em", marginBottom: 2 }}>Experience</div>
                  <div style={{ color: "#9CA3AF", fontSize: 10 }}>Focus sessions earn XP and evolve your pet!</div>
                </div>
              }
              position="top"
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "12px 8px", cursor: "help", gap: 4 }}>
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#5A5450" }}>XP</span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Zap size={13} color="#F59E0B" fill="#F59E0B" />
                  <span style={{ fontFamily: FD, fontWeight: 800, fontSize: 16, color: "#FAF7F2", letterSpacing: "-0.02em" }}>{xp}</span>
                </div>
              </div>
            </Tooltip>

            <div style={{ width: 1, background: "#2C2A26", flexShrink: 0 }} />

            {/* Supercharge */}
            <Tooltip
              content={
                <div style={{ maxWidth: 160 }}>
                  <div style={{ color: "#06B6D4", fontWeight: 800, textTransform: "uppercase", fontSize: 9, letterSpacing: "0.1em", marginBottom: 2 }}>Supercharge ⚡️</div>
                  <div style={{ color: "#9CA3AF", fontSize: 10 }}>Stream G$ to the UBI pool for 100% Health &amp; XP multipliers.</div>
                </div>
              }
              position="top"
            >
              <button
                onClick={(e) => { e.stopPropagation(); setSuperchargeModalOpen(true); }}
                style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "12px 8px", gap: 4,
                  background: "none", border: "none", cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: isStreaming ? "#06B6D4" : "#5A5450" }}>
                  Boost
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  {isStreaming
                    ? <motion.div animate={{ opacity: [0.7, 1, 0.7] }} transition={{ repeat: Infinity, duration: 1.5 }}><Waves size={13} color="#06B6D4" /></motion.div>
                    : <Zap size={13} color="#3A3530" />
                  }
                  <span style={{ fontFamily: FD, fontWeight: 800, fontSize: 16, color: isStreaming ? "#06B6D4" : "#3A3530", letterSpacing: "-0.02em" }}>
                    {isStreaming ? "ON" : "OFF"}
                  </span>
                </div>
              </button>
            </Tooltip>
          </div>

          {/* Supercharge Modal */}
          <SuperchargeModal
            isOpen={superchargeModalOpen}
            onClose={() => setSuperchargeModalOpen(false)}
            isStreaming={isStreaming}
            onStart={startSupercharge}
            onStop={stopSupercharge}
          />
        </motion.div>
      </div>
    </div>
  );
}
