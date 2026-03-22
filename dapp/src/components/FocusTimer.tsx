"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Square,
  CheckCircle2,
  Coins,
  XCircle,
  Moon,
} from "lucide-react";
import { useFocusPet } from "@/hooks/useFocusPet";
import { useBlockNumber } from "wagmi";

const FD = "var(--font-syne), var(--font-geist-sans)";

type TimerState = "idle" | "running" | "paused" | "completed" | "failed";

interface FocusTimerProps {
  initialMinutes?: number;
  onComplete?: (durationMinutes: number) => void;
  onFail?: () => void;
  onStart?: (note: string) => void;
  onPause?: () => void;
  onNoteChange?: (note: string) => void;
  isSupercharged?: boolean;
  streak?: number;
  isNight?: boolean;
}

export function FocusTimer({
  initialMinutes = 25,
  onComplete,
  onFail,
  onStart,
  onPause,
  onNoteChange,
  isSupercharged = false,
  streak = 0,
  isNight = false,
}: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [status, setStatus] = useState<TimerState>("idle");
  const [duration, setDuration] = useState(initialMinutes * 60);
  const [note, setNote] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // remaining fraction: 1.0 = full ring, 0.0 = empty (countdown style)
  const remaining = duration > 0 ? timeLeft / duration : 1;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // --- Persistence Logic ---
  useEffect(() => {
    const saved = localStorage.getItem("focus-session");
    if (saved) {
      try {
        const { status: s, duration: d, endTime: e, note: n } = JSON.parse(saved);
        if (s === "running" && e) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((e - now) / 1000));
          setDuration(d);
          setNote(n);
          onNoteChange?.(n);
          if (remaining > 0) {
            setTimeLeft(remaining);
            setStatus("running");
            endTimeRef.current = e;
          } else {
            setTimeLeft(0);
            setStatus("completed");
            setTimeout(() => onComplete?.(d / 60), 500);
          }
        } else if (s === "paused") {
          setStatus("paused");
          setDuration(d);
          setNote(n);
          onNoteChange?.(n);
        }
      } catch (err) {
        console.error("Failed to restore session:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (status !== "idle" && status !== "failed") {
      localStorage.setItem("focus-session", JSON.stringify({
        status,
        duration,
        endTime: endTimeRef.current,
        note,
        updatedAt: Date.now(),
      }));
    } else {
      localStorage.removeItem("focus-session");
    }
  }, [status, duration, note, timeLeft]);

  const toggleTimer = () => {
    if (status === "running") {
      setStatus("paused");
      onPause?.();
      if (timerRef.current) clearInterval(timerRef.current);
      endTimeRef.current = null;
    } else if (status === "completed") {
      const newTimeLeft = duration;
      setTimeLeft(newTimeLeft);
      endTimeRef.current = Date.now() + newTimeLeft * 1000;
      setStatus("running");
      onStart?.(note);
    } else {
      const newTimeLeft = timeLeft;
      endTimeRef.current = Date.now() + newTimeLeft * 1000;
      setStatus("running");
      onStart?.(note);
    }
  };

  const resetTimer = () => {
    setStatus("idle");
    setTimeLeft(duration);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleDurationSelect = (mins: number) => {
    setDuration(mins * 60);
    setTimeLeft(mins * 60);
    setStatus("idle");
  };

  const [isCustom, setIsCustom] = useState(false);
  const [customMins, setCustomMins] = useState<string>("");

  useEffect(() => {
    const updateTimer = () => {
      if (!endTimeRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setTimeLeft(remaining);
    };

    if (status === "running") {
      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && status === "running") {
        updateTimer();
      }
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [status]);

  useEffect(() => {
    if (timeLeft === 0 && status === "running") {
      setStatus("completed");
      if (timerRef.current) clearInterval(timerRef.current);
      onComplete?.(duration / 60);
    }
  }, [timeLeft, status, onComplete, duration]);

  // Keep wallet/RPC alive during long sessions
  useBlockNumber({ watch: status === "running" });

  const handleCustomSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const parsed = parseFloat(customMins);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 1440) {
        handleDurationSelect(parsed);
        setIsCustom(false);
      } else {
        setIsCustom(false);
        setCustomMins("");
      }
    }
  };

  const handleCustomBlur = () => {
    const parsed = parseFloat(customMins);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 1440) {
      handleDurationSelect(parsed);
    }
    setIsCustom(false);
  };

  const canChangeDuration = status === "idle" || status === "completed";

  const statusLabel =
    status === "idle" ? "Ready to focus" :
    status === "paused" ? "Paused" :
    status === "completed" ? "Session complete!" :
    status === "failed" ? "Session abandoned" :
    "Focusing…";

  const ringColor =
    status === "completed" ? "#2E7A4F" :
    status === "failed"    ? "#DC2626" :
    "#E05C28";

  const isActive = status === "running";
  const RL = 128; // ring radius for 280px viewbox
  const CIRCL = 2 * Math.PI * RL; // ≈ 804.2

  return (
    <div
      style={{
        background: "#1C1A16",
        borderRadius: 28,
        padding: "28px 24px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient glow behind ring */}
      <div
        style={{
          position: "absolute",
          top: "30%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: 320, height: 320,
          borderRadius: "50%",
          background: isActive
            ? "radial-gradient(circle, rgba(224,92,40,0.14) 0%, transparent 70%)"
            : status === "completed"
              ? "radial-gradient(circle, rgba(46,122,79,0.12) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(224,92,40,0.06) 0%, transparent 70%)",
          transition: "background 0.6s",
          pointerEvents: "none",
        }}
      />

      {/* Top row: label + supercharge */}
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#5A5450" }}>
          Focus Session
        </p>
        {isSupercharged && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 99,
              background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)",
              fontSize: 10, fontWeight: 700, color: "#F59E0B",
              textTransform: "uppercase", letterSpacing: "0.08em",
            }}
          >
            <Coins size={11} color="#F59E0B" />
            Supercharged
          </motion.div>
        )}
      </div>

      {/* Duration pills */}
      <div
        style={{
          display: "flex", gap: 4, marginBottom: 22,
          background: "#262420", padding: 4, borderRadius: 99,
          flexWrap: "wrap", justifyContent: "center",
        }}
      >
        {[10, 25, 45].map((mins) => (
          <button
            key={mins}
            onClick={() => handleDurationSelect(mins)}
            disabled={!canChangeDuration}
            style={{
              padding: "7px 18px", borderRadius: 99,
              fontSize: 13, fontWeight: 700, border: "none",
              cursor: canChangeDuration ? "pointer" : "not-allowed",
              background: duration === mins * 60 ? "#FAF7F2" : "transparent",
              color: duration === mins * 60 ? "#1C1A16" : "#5A5450",
              boxShadow: duration === mins * 60 ? "0 1px 6px rgba(0,0,0,0.2)" : "none",
              transition: "all 0.15s",
              opacity: canChangeDuration ? 1 : 0.4,
            }}
          >
            {mins}m
          </button>
        ))}

        {isCustom ? (
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={customMins}
            onChange={(e) => setCustomMins(e.target.value)}
            onKeyDown={handleCustomSubmit}
            onBlur={handleCustomBlur}
            disabled={!canChangeDuration}
            style={{
              width: 60, padding: "7px 8px", borderRadius: 99,
              background: "#FAF7F2", border: "1.5px solid #E05C28",
              fontSize: 13, fontWeight: 700,
              textAlign: "center", outline: "none", color: "#1C1A16",
            }}
            placeholder="min"
          />
        ) : (
          <button
            onClick={() => setIsCustom(true)}
            disabled={!canChangeDuration}
            style={{
              padding: "7px 16px", borderRadius: 99,
              fontSize: 13, fontWeight: 700, border: "none",
              cursor: canChangeDuration ? "pointer" : "not-allowed",
              background: ![10, 25, 45].includes(duration / 60) ? "#FAF7F2" : "transparent",
              color: ![10, 25, 45].includes(duration / 60) ? "#1C1A16" : "#5A5450",
              opacity: canChangeDuration ? 1 : 0.4,
            }}
          >
            {![10, 25, 45].includes(duration / 60) ? `${duration / 60}m` : "Custom"}
          </button>
        )}
      </div>

      {/* Note input */}
      <div style={{ width: "100%", position: "relative", marginBottom: 28 }}>
        <input
          type="text"
          value={note}
          onChange={(e) => { setNote(e.target.value); onNoteChange?.(e.target.value); }}
          disabled={status === "running" || status === "paused"}
          placeholder="What are you focusing on?"
          style={{
            width: "100%",
            padding: "11px 16px",
            borderRadius: 12,
            border: `1.5px solid ${isActive ? "rgba(224,92,40,0.5)" : "#2C2A26"}`,
            background: "#262420",
            fontSize: 13, fontWeight: 600,
            color: isActive ? "#E05C28" : "#FAF7F2",
            outline: "none", textAlign: "center",
            boxSizing: "border-box", transition: "all 0.2s",
          }}
        />
        {/* Placeholder colour override via CSS trick not needed — handled by style */}
        {note && (status === "running" || status === "paused") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
              background: "#E05C28", color: "#fff",
              fontSize: 8, fontWeight: 800, padding: "3px 10px",
              borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.12em",
              whiteSpace: "nowrap",
            }}
          >
            Active Intention
          </motion.div>
        )}
      </div>

      {/* ── Ring ── */}
      <div
        style={{
          position: "relative", width: 280, height: 280,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        <svg
          viewBox="0 0 280 280"
          style={{ position: "absolute", width: "100%", height: "100%", transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle cx="140" cy="140" r={RL} fill="none" stroke="#2C2A26" strokeWidth="12" />
          {/* Progress */}
          <motion.circle
            cx="140" cy="140" r={RL}
            fill="none"
            stroke={ringColor}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCL}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset: CIRCL * (1 - remaining) }}
            transition={{ duration: 0.5 }}
            style={{
              filter: isActive
                ? `drop-shadow(0 0 10px ${ringColor}99)`
                : status === "completed"
                  ? "drop-shadow(0 0 8px rgba(46,122,79,0.7))"
                  : "none",
            }}
          />
        </svg>

        {/* Center text */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 10 }}>
          <motion.span
            key={timeLeft}
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            style={{
              fontFamily: "var(--font-geist-mono)",
              fontSize: 52, fontWeight: 700,
              letterSpacing: "-0.03em",
              color: "#FAF7F2", lineHeight: 1,
            }}
          >
            {formatTime(timeLeft)}
          </motion.span>

          {isNight && status === "idle" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "4px 10px", borderRadius: 99,
                background: "rgba(224,92,40,0.15)", marginTop: 10,
              }}
            >
              <Moon size={10} color="#E05C28" />
              <span style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#E05C28" }}>
                Night Owl 1.1×
              </span>
            </motion.div>
          )}

          <span
            style={{
              marginTop: 10,
              fontSize: 10, fontWeight: 700, color: "#5A5450",
              textTransform: "uppercase", letterSpacing: "0.12em",
              whiteSpace: "nowrap",
            }}
          >
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", gap: 16, marginTop: 28, alignItems: "center" }}>
        <motion.button
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          onClick={toggleTimer}
          style={{
            width: 64, height: 64, borderRadius: "50%",
            border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            background:
              status === "completed" ? "#2E7A4F" :
              status === "failed"    ? "#DC2626" :
              "#E05C28",
            boxShadow:
              status === "completed" ? "0 4px 20px rgba(46,122,79,0.45)" :
              status === "failed"    ? "0 4px 20px rgba(220,38,38,0.45)" :
              isActive               ? "0 4px 24px rgba(224,92,40,0.55)" :
              "0 4px 20px rgba(224,92,40,0.4)",
          }}
        >
          {status === "completed" ? (
            <CheckCircle2 size={26} color="#fff" />
          ) : status === "failed" ? (
            <XCircle size={26} color="#fff" />
          ) : isActive ? (
            <Pause size={24} color="#fff" />
          ) : (
            <Play size={24} color="#fff" style={{ marginLeft: 3 }} />
          )}
        </motion.button>

        {status !== "idle" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={resetTimer}
            style={{
              width: 48, height: 48, borderRadius: "50%",
              border: "1px solid #2C2A26",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "#262420",
            }}
          >
            <Square size={15} color="#5A5450" />
          </motion.button>
        )}
      </div>

      {/* Failed overlay */}
      <AnimatePresence>
        {status === "failed" && (
          <div
            style={{
              position: "absolute", inset: 0,
              background: "rgba(28,26,22,0.94)",
              backdropFilter: "blur(8px)",
              zIndex: 50,
              display: "flex", alignItems: "center", justifyContent: "center",
              borderRadius: 28, padding: 24,
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: "#262420", padding: 32, borderRadius: 20,
                maxWidth: 280, textAlign: "center",
                border: "1px solid #3A3530",
              }}
            >
              <div
                style={{
                  width: 56, height: 56, borderRadius: "50%",
                  background: "rgba(220,38,38,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "0 auto 16px",
                }}
              >
                <XCircle size={28} color="#DC2626" />
              </div>
              <h2 style={{ fontFamily: FD, fontWeight: 800, fontSize: 20, color: "#FAF7F2", marginBottom: 8 }}>
                Session abandoned
              </h2>
              <p style={{ fontSize: 13, color: "#7A7067", lineHeight: 1.65, marginBottom: 20 }}>
                You left the session. Your pet noticed. 🥺
              </p>
              <button
                onClick={resetTimer}
                style={{
                  width: "100%", padding: "13px 0",
                  background: "#DC2626", color: "#fff",
                  border: "none", borderRadius: 12,
                  fontFamily: FD, fontWeight: 800, fontSize: 14,
                  cursor: "pointer",
                  boxShadow: "0 4px 16px rgba(220,38,38,0.35)",
                }}
              >
                Try Again
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
