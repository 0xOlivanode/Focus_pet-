"use client";

import React, { useState, useEffect, useRef } from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { BoostBadge } from "./BoostBadge";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Square,
  CheckCircle2,
  AlertCircle,
  Coins,
  XCircle,
  Moon,
} from "lucide-react";
import { useFocusPet } from "@/hooks/useFocusPet";
import { useBlockNumber, useAccount } from "wagmi";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type TimerState = "idle" | "running" | "paused" | "completed" | "failed";

const STEPS = [
  5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100, 110, 120,
];

interface FocusTimerProps {
  initialMinutes?: number;
  onComplete?: (durationMinutes: number) => void;
  onFail?: () => void;
  onStop?: () => void;
  onStart?: (note: string) => void;
  onPause?: () => void;
  onNoteChange?: (note: string) => void;
  isSupercharged?: boolean;
  streak?: number;
  isNight?: boolean;
  embedded?: boolean;
  boostEndTime?: number;
  shieldCount?: number;
  streakBonus?: number;
}

export function FocusTimer({
  initialMinutes = 25,
  onComplete,
  onFail,
  onStop,
  onStart,
  onPause,
  onNoteChange,
  isSupercharged = false,
  streak = 0,
  isNight = false,
  embedded = false,
  boostEndTime = 0,
  shieldCount = 0,
  streakBonus = 0,
}: FocusTimerProps) {
  const xpBoostActive = boostEndTime > Math.floor(Date.now() / 1000);
  const shieldActive = shieldCount > 0;
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [status, setStatus] = useState<TimerState>("idle");
  const [duration, setDuration] = useState(initialMinutes * 60);
  const [note, setNote] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const { address } = useAccount();

  // ── Focus reminder helpers (QStash for iOS + SW fallback for Android/desktop) ──

  async function scheduleFocusReminder(endTime: number) {
    if (typeof window === "undefined") return;
    if (!("Notification" in window) || Notification.permission !== "granted")
      return;
    if (!address) return;

    // QStash handles delivery for all platforms including iOS
    fetch("/api/notifications/schedule-focus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, endTime }),
    }).catch(console.error);
  }

  async function cancelFocusReminder() {
    if (typeof window === "undefined") return;
    if (!address) return;

    // Mark cancelled in Supabase so the QStash callback is a no-op
    fetch("/api/notifications/schedule-focus", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    }).catch(console.error);
  }

  const progress = ((duration - timeLeft) / duration) * 100;

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
        const {
          status: s,
          duration: d,
          endTime: e,
          note: n,
        } = JSON.parse(saved);
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
            scheduleFocusReminder(e);
          } else {
            // Session finished while away
            setTimeLeft(0);
            setStatus("completed");
            // Trigger completion after a short delay to ensure parent is ready
            setTimeout(() => onComplete?.(d / 60), 500);
          }
        } else if (s === "paused") {
          // Keep paused state but don't resume automatically
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
      localStorage.setItem(
        "focus-session",
        JSON.stringify({
          status,
          duration,
          endTime: endTimeRef.current,
          note,
          updatedAt: Date.now(),
        }),
      );
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
      cancelFocusReminder();
    } else if (status === "completed") {
      // Restart logic
      const newTimeLeft = duration;
      setTimeLeft(newTimeLeft);
      const et = Date.now() + newTimeLeft * 1000;
      endTimeRef.current = et;
      setStatus("running");
      onStart?.(note);
      scheduleFocusReminder(et);
    } else {
      const newTimeLeft = timeLeft;
      const et = Date.now() + newTimeLeft * 1000;
      endTimeRef.current = et;
      setStatus("running");
      onStart?.(note);
      scheduleFocusReminder(et);
    }
  };

  const resetTimer = () => {
    setStatus("idle");
    setTimeLeft(duration);
    if (timerRef.current) clearInterval(timerRef.current);
    cancelFocusReminder();
    onStop?.();
  };

  const handleDurationSelect = (mins: number) => {
    setDuration(mins * 60);
    setTimeLeft(mins * 60);
    setStatus("idle");
  };

  const [isCustom, setIsCustom] = useState(false);
  const [customMins, setCustomMins] = useState<string>("");
  const [sliderIndex, setSliderIndex] = useState(() => {
    const idx = STEPS.indexOf(initialMinutes);
    return idx !== -1 ? idx : 4; // default to 25min
  });

  useEffect(() => {
    const updateTimer = () => {
      if (!endTimeRef.current) return;
      const now = Date.now();
      const remaining = Math.max(
        0,
        Math.ceil((endTimeRef.current - now) / 1000),
      );
      setTimeLeft(remaining);
    };

    if (status === "running") {
      updateTimer(); // Initial sync
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

  // Handle completion
  useEffect(() => {
    if (timeLeft === 0 && status === "running") {
      setStatus("completed");
      if (timerRef.current) clearInterval(timerRef.current);
      cancelFocusReminder();
      onComplete?.(duration / 60);
    }
  }, [timeLeft, status, onComplete, duration]);

  // Prevent Wallet Connect / RPC from sleeping during multi-hour sessions
  useBlockNumber({
    watch: status === "running",
  });

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

  // Auto-reset 2 s after session completes in embedded mode
  useEffect(() => {
    if (!embedded || status !== "completed") return;
    const t = setTimeout(() => resetTimer(), 2000);
    return () => clearTimeout(t);
  }, [embedded, status]);

  // Keep slider in sync when preset pills are clicked
  useEffect(() => {
    const idx = STEPS.indexOf(duration / 60);
    if (idx !== -1) setSliderIndex(idx);
  }, [duration]);

  // ── Embedded layout (right-half of the main app card) ──────────────────
  if (embedded) {
    const isIdle = status === "idle" || status === "failed";
    const isDone = status === "completed";

    if (isIdle || isDone) {
      return (
        <div className="flex flex-col gap-6 h-full">
          {isDone && (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 size={40} className="text-emerald-400" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <p className="text-white font-semibold text-lg">
                  Session Complete!
                </p>
                <p className="text-neutral-500 text-xs mt-1">
                  Great work. Back in a moment…
                </p>
              </motion.div>
            </div>
          )}

          {!isDone && (
            <>
              <div className="space-y-4">
                <p className="text-[#A9A9A9] text-base/[100%] font-medium">
                  Focus for
                </p>

                {/* Duration pills */}
                <div className="flex flex-wrap bg-[#141414] rounded-full p-1">
                  {[10, 25, 45, 60].map((mins) => (
                    <button
                      key={mins}
                      style={
                        duration === mins * 60
                          ? { boxShadow: "0px 2px 10px 0px #7474741A" }
                          : {}
                      }
                      onClick={() => handleDurationSelect(mins)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all flex-1",
                        duration === mins * 60
                          ? "bg-white text-black"
                          : " text-[#646363] hover:text-neutral-200",
                      )}
                    >
                      {mins === 60 ? "1h" : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center text-[#A9A9A9] text-base/[100%] font-medium">
                  <p>Custom Time</p>
                  <p>Max: 2h</p>
                </div>
                <div className="flex items-center justify-between gap-2 bg-[#161616] rounded-full py-5 px-6">
                  <RadixSlider.Root
                    className="relative flex flex-1 items-center select-none touch-none"
                    min={0}
                    max={STEPS.length - 1}
                    step={1}
                    value={[sliderIndex]}
                    onValueChange={([idx]) => {
                      setSliderIndex(idx);
                      handleDurationSelect(STEPS[idx]);
                    }}
                  >
                    <RadixSlider.Track className="relative flex-1 h-[6px] rounded-full bg-[#202020]">
                      <RadixSlider.Range className="absolute h-full rounded-full bg-white" />
                    </RadixSlider.Track>
                    <RadixSlider.Thumb className="block w-5 h-5 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.5)] focus:outline-none" />
                  </RadixSlider.Root>
                  <span className="text-white text-sm/[100%] font-mono font-medium tabular-nums text-right w-[60px] shrink-0">
                    {STEPS[sliderIndex] >= 60
                      ? `${Math.floor(STEPS[sliderIndex] / 60)}h${STEPS[sliderIndex] % 60 > 0 ? ` ${STEPS[sliderIndex] % 60}m` : ""}`
                      : `${STEPS[sliderIndex]}min`}
                  </span>
                </div>
              </div>
            </>
          )}

          {!isDone && (
            <button
              onClick={toggleTimer}
              className=" w-fit px-10 py-3.5 rounded-full bg-white hover:bg-neutral-100 text-black font-semibold text-sm transition-all"
            >
              Start focus
            </button>
          )}
        </div>
      );
    }

    // Running / paused — split H/M/S display
    const hrs = Math.floor(timeLeft / 3600);
    const mins = Math.floor((timeLeft % 3600) / 60);
    const secs = timeLeft % 60;
    const durationMins = duration / 60;
    const durationLabel =
      durationMins >= 60
        ? `${Math.floor(durationMins / 60)} hour${Math.floor(durationMins / 60) !== 1 ? "s" : ""}`
        : `${durationMins} min`;

    return (
      <div className="flex flex-col h-full gap-5">
        {/* Controls row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-4 bg-[#0F0F0F] rounded-full py-4 px-6 shrink-0">
            <button
              onClick={status === "paused" ? toggleTimer : undefined}
              disabled={status === "running"}
              className="text-neutral-400 hover:text-white transition-colors disabled:opacity-25 disabled:cursor-default"
              aria-label="Play"
            >
              <Play size={17} />
            </button>
            <button
              onClick={status === "running" ? toggleTimer : undefined}
              disabled={status === "paused"}
              className="text-neutral-400 hover:text-white transition-colors disabled:opacity-25 disabled:cursor-default"
              aria-label="Pause"
            >
              <Pause size={17} />
            </button>
            <button
              onClick={resetTimer}
              className="text-neutral-400 hover:text-white transition-colors"
              aria-label="Stop"
            >
              <Square size={17} />
            </button>
          </div>

          {/* Active boost badges */}
          {(isNight || xpBoostActive || streakBonus > 0) && (
            <div className="flex items-center gap-2 flex-wrap">
              {isNight && <BoostBadge variant="night" />}
              {xpBoostActive && <BoostBadge variant="xp" />}
              {streakBonus > 0 && (
                <BoostBadge variant="streak" label={`Streak · +${streakBonus}%`} />
              )}
            </div>
          )}

          {/* Session duration pill — pushed to the right on larger screens */}
          <div className="flex items-center rounded-full bg-[#0F0F0F] p-1 h-fit ml-auto">
            <span className="hidden sm:block text-white text-sm whitespace-nowrap px-4">
              Current focus session:
            </span>
            <div className="px-5 py-3 rounded-full bg-[#1F1F1F] text-white text-sm font-medium whitespace-nowrap">
              {durationLabel}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#131313] rounded-full h-[6px] overflow-hidden">
          <motion.div
            className="bg-white h-full rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* H / M / S display */}
        <div className="flex-1 flex items-center">
          <div className="w-full bg-[#0F0F0F] p-5 lg:p-7 xl:p-10 rounded-xl flex items-center justify-between min-w-0">
            {/* Hours */}
            <div className="flex flex-col items-center gap-1 xl:gap-2 flex-1 min-w-0">
              {/* <span className="text-neutral-500 text-left text-xs xl:text-sm">
                Hours
              </span> */}
              <span className="text-white text-4xl lg:text-5xl xl:text-[80px] font-mono tabular-nums leading-none">
                {String(hrs).padStart(2, "0")}
                <span className="text-neutral-500 text-xl lg:text-2xl xl:text-4xl font-sans font-light tracking-widest align-baseline ml-0.5">
                  Hours
                </span>
              </span>
            </div>

            {/* Colon 1 */}
            <span className="text-neutral-400 text-xl xl:text-3xl font-bold select-none pb-1 mx-1 xl:mx-2">
              :
            </span>

            {/* Minutes */}
            <div className="flex flex-col items-center gap-1 xl:gap-2 flex-1 min-w-0">
              {/* <span className="text-neutral-500 text-xs xl:text-sm text-left">
                Minutes
              </span> */}
              <span className="text-white text-4xl lg:text-5xl xl:text-[80px] font-mono tabular-nums leading-none">
                {String(mins).padStart(2, "0")}
                <span className="text-neutral-500 text-xl lg:text-2xl xl:text-4xl font-sans font-light tracking-widest align-baseline ml-0.5">
                  Mins
                </span>
              </span>
            </div>

            {/* Colon 2 */}
            <span className="text-neutral-400 text-xl xl:text-3xl font-bold select-none pb-1 mx-1 xl:mx-2">
              :
            </span>

            {/* Seconds */}
            <div className="flex flex-col items-center gap-1 xl:gap-2 flex-1 min-w-0">
              {/* <span className="text-neutral-500 text-xs xl:text-sm">
                Seconds
              </span> */}
              <span className="text-white text-4xl lg:text-5xl xl:text-[80px] font-mono tabular-nums leading-none">
                {String(secs).padStart(2, "0")}
                <span className="text-neutral-500 text-xl lg:text-2xl xl:text-4xl font-sans font-light tracking-widest align-baseline ml-0.5">
                  Secs
                </span>
              </span>
            </div>
          </div>
        </div>

        {note && (
          <p className="text-neutral-600 text-xs italic truncate">"{note}"</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6">
      {/* Duration Selector */}
      <div className="flex flex-wrap gap-2 mb-8 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full items-center justify-center">
        {[10, 25, 45].map((mins) => (
          <button
            key={mins}
            onClick={() => handleDurationSelect(mins)}
            disabled={status !== "idle" && status !== "completed"}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
              duration === mins * 60
                ? "bg-white dark:bg-black shadow-sm text-black dark:text-white"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
              status !== "idle" &&
                status !== "completed" &&
                "opacity-50 cursor-not-allowed",
            )}
          >
            {mins}m
          </button>
        ))}

        {/* Custom Duration Input */}
        {isCustom ? (
          <input
            autoFocus
            type="text"
            inputMode="decimal"
            value={customMins}
            onChange={(e) => setCustomMins(e.target.value)}
            onKeyDown={handleCustomSubmit}
            onBlur={handleCustomBlur}
            disabled={status !== "idle" && status !== "completed"}
            style={{ fontSize: "16px" }}
            className={cn(
              "w-16 px-2 py-2 rounded-full bg-white dark:bg-black shadow-[inset_0_0_0_2px_#6366f1] font-medium text-center outline-hidden transition-all text-black dark:text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
              status !== "idle" &&
                status !== "completed" &&
                "opacity-50 cursor-not-allowed",
            )}
            placeholder="min"
          />
        ) : (
          <button
            onClick={() => setIsCustom(true)}
            disabled={status !== "idle" && status !== "completed"}
            className={cn(
              "px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all",
              ![10, 25, 45].includes(duration / 60)
                ? "bg-white dark:bg-black shadow-sm text-black dark:text-white"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300",
              status !== "idle" &&
                status !== "completed" &&
                "opacity-50 cursor-not-allowed",
            )}
          >
            {![10, 25, 45].includes(duration / 60)
              ? `${duration / 60}m`
              : "Custom"}
          </button>
        )}
      </div>
      {/* Focus Note Input */}
      <div className="w-full mb-8 relative group">
        <input
          type="text"
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            onNoteChange?.(e.target.value);
          }}
          disabled={status === "running" || status === "paused"}
          placeholder="What are we focusing on?"
          className={cn(
            "w-full bg-neutral-100 dark:bg-neutral-800/50 border-2 border-transparent px-6 py-4 rounded-3xl text-sm font-bold text-center transition-all placeholder:text-neutral-400 focus:outline-hidden",
            status === "running" || status === "paused"
              ? "opacity-50 border-indigo-500/20 text-indigo-500"
              : "hover:bg-neutral-200 dark:hover:bg-neutral-800 focus:bg-white dark:focus:bg-neutral-900 focus:border-indigo-500/50 focus:shadow-xl focus:shadow-indigo-500/5",
          )}
        />
        {note && (status === "running" || status === "paused") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-[8px] font-black text-white px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-indigo-500/30"
          >
            ACTIVE INTENTION
          </motion.div>
        )}
      </div>
      {/* Main Timer Display */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Background Ring */}
        <svg className="absolute w-full h-full transform -rotate-90">
          <circle
            cx="144"
            cy="144"
            r="130"
            className="stroke-neutral-200 dark:stroke-neutral-800 fill-none"
            strokeWidth="12"
          />
          {/* Progress Ring */}
          <motion.circle
            cx="144"
            cy="144"
            r="130"
            className="stroke-indigo-500 fill-none"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray="816" // 2 * PI * 130
            initial={{ strokeDashoffset: 816 }}
            animate={{ strokeDashoffset: 816 - (816 * progress) / 100 }}
            transition={{ duration: 0.5 }}
          />
        </svg>

        {/* Time Text */}
        <div className="flex flex-col items-center z-10">
          <motion.div
            key={timeLeft}
            initial={{ opacity: 0.5, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl font-bold font-mono tracking-tighter text-neutral-900 dark:text-white"
          >
            {formatTime(timeLeft)}
          </motion.div>

          {isNight && status === "idle" && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20"
            >
              <Moon className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">
                Night Owl Bonus 1.1x
              </span>
            </motion.div>
          )}
          <p className="text-neutral-500 mt-2 font-medium bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full text-xs uppercase tracking-widest">
            {status === "idle"
              ? "Ready to Focus"
              : status === "paused"
                ? "Paused"
                : status === "completed"
                  ? "Session Complete"
                  : status === "failed"
                    ? "Focus Abandoned"
                    : "Focusing..."}
          </p>
        </div>
      </div>
      {/* Controls */}
      <div className="flex gap-4 mt-8">
        {status === "idle" ||
        status === "paused" ||
        status === "completed" ||
        status === "failed" ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all",
              status === "completed"
                ? "bg-green-500 shadow-green-500/30"
                : status === "failed"
                  ? "bg-red-500 shadow-red-500/30"
                  : "bg-indigo-600 shadow-indigo-500/30",
            )}
          >
            {status === "completed" ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
            ) : status === "failed" ? (
              <XCircle className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 ml-1 text-white" />
            )}
          </motion.button>
        ) : (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30"
          >
            <Pause className="w-6 h-6 text-white" />
          </motion.button>
        )}

        {status !== "idle" && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetTimer}
            className="w-16 h-16 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 flex items-center justify-center"
          >
            <Square className="w-5 h-5 text-white" />
          </motion.button>
        )}
      </div>
      <AnimatePresence>
        {status === "failed" && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center rounded-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-neutral-900 p-8 rounded-2xl max-w-xs text-center mx-4 shadow-2xl border border-red-500/20"
            >
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mb-4">
                <XCircle size={32} />
              </div>
              <h2 className="text-2xl font-black mb-2 text-neutral-900 dark:text-white">
                Focus Abandoned!
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-6 leading-relaxed">
                You left the session and broke your focus and now your pet is
                disappointed. 🥺
              </p>
              <button
                onClick={resetTimer}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-3 rounded-xl transition-colors shadow-lg shadow-red-600/20"
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
