"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, type Easing } from "framer-motion";
import { X, ArrowRight } from "lucide-react";

const C = {
  cream: "#FAF7F2",
  creamDark: "#F0EBE3",
  border: "#E8E0D5",
  text: "#1C1A16",
  muted: "#7A7067",
  orange: "#E05C28",
  orangeLight: "#FFF0EA",
  green: "#2E7A4F",
  greenLight: "#EAF5EF",
};

const FD = "var(--font-syne), var(--font-geist-sans)";
const EASE: Easing = [0.22, 1, 0.36, 1] as unknown as Easing;

interface OnboardingModalProps {
  onClose: () => void;
}

const steps = [
  {
    id: 1,
    emoji: "🥚",
    title: "Focus to Start",
    description:
      "Set your timer and get to work. Your pet stays an egg until you complete your first session — hatch it by doing the thing.",
    impact: "Hatch your pet & earn base XP",
    impactColor: C.orange,
    impactBg: C.orangeLight,
  },
  {
    id: 2,
    emoji: "⚡️",
    title: "Supercharge It",
    description:
      "Stream G$ to the UBI pool to reach God Mode. Get 100% Health stability and up to a 2× XP multiplier on every session.",
    impact: "Boost XP & auto-heal your pet",
    impactColor: "#B45309",
    impactBg: "#FFFBEB",
  },
  {
    id: 3,
    emoji: "🛍️",
    title: "Visit the Shop",
    description:
      "Spend your earned G$ on Food to heal, Shields to prevent decay, and Cosmetics to give your pet its own vibe.",
    impact: "Level up faster & look cool",
    impactColor: C.orange,
    impactBg: C.orangeLight,
  },
  {
    id: 4,
    emoji: "🌍",
    title: "Global Impact",
    description:
      "Every second you focus, you contribute to the Global UBI pool. Your deep work literally helps feed the world.",
    impact: "Help provide basic income",
    impactColor: C.green,
    impactBg: C.greenLight,
  },
  {
    id: 5,
    emoji: "🛡️",
    title: "Get Verified",
    description:
      "Complete Face Verification to earn a Verified Focuser badge. Lock in your leaderboard position and flex your credibility.",
    impact: "Badge & leaderboard prestige",
    impactColor: "#1D4ED8",
    impactBg: "#EFF6FF",
  },
];

export function OnboardingModal({ onClose }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const current = steps[step - 1];
  const isLast = step === steps.length;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(28,26,22,0.45)",
          backdropFilter: "blur(8px)",
        }}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{
          position: "relative",
          background: C.cream,
          borderRadius: 28,
          width: "100%",
          maxWidth: 420,
          overflow: "hidden",
          boxShadow: "0 24px 64px rgba(28,26,22,0.18)",
          border: `1px solid ${C.border}`,
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 20px 0",
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: C.muted,
            }}
          >
            How It Works
          </span>
          <button
            onClick={onClose}
            style={{
              background: C.creamDark,
              border: "none",
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.muted,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Step content */}
        <div
          style={{
            padding: "24px 28px 28px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: EASE }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              {/* Emoji bubble */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: "50%",
                  background: C.creamDark,
                  border: `2px solid ${C.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  marginBottom: 24,
                  boxShadow: "0 4px 16px rgba(28,26,22,0.08)",
                }}
              >
                {current.emoji}
              </motion.div>

              {/* Step counter */}
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: C.orange,
                  marginBottom: 8,
                }}
              >
                Step {step} of {steps.length}
              </div>

              {/* Title */}
              <h2
                style={{
                  fontFamily: FD,
                  fontSize: 22,
                  fontWeight: 800,
                  color: C.text,
                  marginBottom: 12,
                  lineHeight: 1.2,
                }}
              >
                {current.title}
              </h2>

              {/* Description */}
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.65,
                  color: C.muted,
                  maxWidth: 300,
                  marginBottom: 20,
                }}
              >
                {current.description}
              </p>

              {/* Impact pill */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 99,
                  background: current.impactBg,
                  border: `1px solid ${current.impactColor}22`,
                }}
              >
                <motion.div
                  animate={{ scale: [1, 1.4, 1] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: current.impactColor,
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: current.impactColor,
                  }}
                >
                  {current.impact}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Progress dots */}
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 28,
              marginBottom: 24,
              alignItems: "center",
            }}
          >
            {steps.map((s) => (
              <motion.div
                key={s.id}
                animate={{
                  width: step === s.id ? 24 : 6,
                  background: step === s.id ? C.orange : C.border,
                }}
                transition={{ duration: 0.25 }}
                style={{ height: 6, borderRadius: 99 }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
            <motion.button
              onClick={isLast ? onClose : () => setStep(step + 1)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: "100%",
                padding: "14px 0",
                background: C.orange,
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontFamily: FD,
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 16px rgba(224,92,40,0.3)",
              }}
            >
              {isLast ? "Let's go! 🚀" : "Next"}
              {!isLast && <ArrowRight size={16} />}
            </motion.button>

            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: C.muted,
                cursor: "pointer",
                padding: "4px 0",
              }}
            >
              Skip Tutorial
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
