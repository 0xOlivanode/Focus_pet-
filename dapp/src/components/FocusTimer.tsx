"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, Square, CheckCircle2, AlertCircle } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

type TimerState = "idle" | "running" | "paused" | "completed";

interface FocusTimerProps {
  initialMinutes?: number;
  onComplete?: (durationMinutes: number) => void;
  onStart?: () => void;
  onPause?: () => void;
}

export function FocusTimer({
  initialMinutes = 25,
  onComplete,
  onStart,
  onPause,
}: FocusTimerProps) {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60);
  const [status, setStatus] = useState<TimerState>("idle");
  const [duration, setDuration] = useState(initialMinutes * 60);

  // Anti-cheat state
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [checkInMissed, setCheckInMissed] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const progress = ((duration - timeLeft) / duration) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = () => {
    if (status === "running") {
      setStatus("paused");
      onPause?.();
      if (timerRef.current) clearInterval(timerRef.current);
    } else if (status === "completed") {
      // Restart logic
      setTimeLeft(duration);
      setStatus("running");
      onStart?.();
    } else {
      setStatus("running");
      onStart?.();
    }
  };

  const resetTimer = () => {
    setStatus("idle");
    setTimeLeft(duration);
    if (timerRef.current) clearInterval(timerRef.current);
    setShowCheckIn(false);
    setCheckInMissed(false);
  };

  const handleDurationSelect = (mins: number) => {
    setDuration(mins * 60);
    setTimeLeft(mins * 60);
    setStatus("idle");
  };

  useEffect(() => {
    if (status === "running") {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0;
          }
          // Random Check-in Logic (1% chance per second)
          if (!showCheckIn && Math.random() < 0.005 && prev > 60) {
            setShowCheckIn(true);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, showCheckIn]);

  // Handle completion
  useEffect(() => {
    if (timeLeft === 0 && status === "running") {
      setStatus("completed");
      if (timerRef.current) clearInterval(timerRef.current);
      onComplete?.(duration / 60);
    }
  }, [timeLeft, status, onComplete, duration]);

  // Check-in timeout logic
  useEffect(() => {
    let checkInTimer: NodeJS.Timeout;
    if (showCheckIn) {
      checkInTimer = setTimeout(() => {
        setCheckInMissed(true);
        setStatus("paused"); // Penalty: pause timer
        setShowCheckIn(false);
      }, 15000); // 15s to respond
    }
    return () => clearTimeout(checkInTimer);
  }, [showCheckIn]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-md mx-auto p-6">
      {/* Duration Selector */}
      <div className="flex gap-2 mb-8 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-full">
        {[0.5, 10, 25, 45].map((mins) => (
          <button
            key={mins}
            onClick={() => handleDurationSelect(mins)}
            disabled={status !== "idle" && status !== "completed"}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
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
          <p className="text-neutral-500 mt-2 font-medium bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full text-xs uppercase tracking-widest">
            {status === "idle"
              ? "Ready to Focus"
              : status === "paused"
                ? "Paused"
                : status === "completed"
                  ? "Session Complete"
                  : "Focusing..."}
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mt-8">
        {status === "idle" || status === "paused" || status === "completed" ? (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleTimer}
            className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all",
              status === "completed"
                ? "bg-green-500 shadow-green-500/30"
                : "bg-indigo-600 shadow-indigo-500/30",
            )}
          >
            {status === "completed" ? (
              <CheckCircle2 className="w-6 h-6 text-white" />
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

      {/* Popups / Alerts */}
      <AnimatePresence>
        {showCheckIn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute bottom-20 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-4 rounded-2xl shadow-xl flex items-center gap-4 z-50 w-80"
          >
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
              <AlertCircle size={20} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">Still focused?</h3>
              <p className="text-xs text-neutral-500">
                Tap to confirm presence
              </p>
            </div>
            <button
              onClick={() => setShowCheckIn(false)}
              className="bg-black dark:bg-white text-white dark:text-black text-xs font-bold px-4 py-2 rounded-lg"
            >
              I'm Here
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {checkInMissed && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-3xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white dark:bg-neutral-900 p-6 rounded-2xl max-w-xs text-center mx-4"
            >
              <div className="mx-auto w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-3">
                <AlertCircle />
              </div>
              <h2 className="text-xl font-bold mb-2">Check-in Missed</h2>
              <p className="text-neutral-500 text-sm mb-4">
                You missed the focus check. The timer has been paused. Stay
                alert to keep your pet happy!
              </p>
              <button
                onClick={() => setCheckInMissed(false)}
                className="w-full bg-indigo-600 text-white font-bold py-2 rounded-xl"
              >
                Resume
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
