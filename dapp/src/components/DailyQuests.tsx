"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, CheckCircle2, Clock, Zap, Flame, Shield } from "lucide-react";

// ─── Data Model ───────────────────────────────────────────────────────────────

export type QuestType =
  | "focus_time"
  | "streak"
  | "feed"
  | "focus_sessions"
  | "supercharge";

export interface Quest {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  type: QuestType;
  target: number; // e.g. 60 (minutes), 3 (sessions), 1 (yes/no)
  rewardXp: number;
  rewardGd: number; // in G$ cents (display only)
}

// The full pool of possible quests
const QUEST_POOL: Quest[] = [
  {
    id: "focus_60",
    icon: <Clock className="w-4 h-4" />,
    title: "Deep Work Block",
    description: "Complete 60 minutes of focus",
    type: "focus_time",
    target: 60,
    rewardXp: 50,
    rewardGd: 5,
  },
  {
    id: "focus_25",
    icon: <Clock className="w-4 h-4" />,
    title: "Pomodoro Starter",
    description: "Complete a 25-min focus session",
    type: "focus_time",
    target: 25,
    rewardXp: 20,
    rewardGd: 2,
  },
  {
    id: "sessions_3",
    icon: <Target className="w-4 h-4" />,
    title: "Triple Focus",
    description: "Complete 3 focus sessions today",
    type: "focus_sessions",
    target: 3,
    rewardXp: 60,
    rewardGd: 6,
  },
  {
    id: "streak_keep",
    icon: <Flame className="w-4 h-4" />,
    title: "Streak Keeper",
    description: "Focus at least once to keep your streak",
    type: "streak",
    target: 1,
    rewardXp: 30,
    rewardGd: 3,
  },
  {
    id: "supercharge",
    icon: <Zap className="w-4 h-4" />,
    title: "Supercharged Day",
    description: "Focus with your G$ stream active",
    type: "supercharge",
    target: 1,
    rewardXp: 80,
    rewardGd: 8,
  },
  {
    id: "focus_45",
    icon: <Clock className="w-4 h-4" />,
    title: "Flow State",
    description: "Complete a 45-min focus session",
    type: "focus_time",
    target: 45,
    rewardXp: 40,
    rewardGd: 4,
  },
];

// ─── Rotation Logic ────────────────────────────────────────────────────────────

function getDailyQuests(): Quest[] {
  // Use today's date as a seed to rotate 3 quests per day
  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();
  const shuffled = [...QUEST_POOL].sort((a, b) => {
    // Deterministic sort using seed + index
    const hashA = (seed * (a.id.charCodeAt(0) + 1)) % 100;
    const hashB = (seed * (b.id.charCodeAt(0) + 1)) % 100;
    return hashA - hashB;
  });
  return shuffled.slice(0, 3);
}

function getStorageKey() {
  const today = new Date();
  return `focuspet_quests_${today.getFullYear()}_${today.getMonth()}_${today.getDate()}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DailyQuestsProps {
  focusMinutesToday?: number;
  focusSessionsToday?: number;
  streak?: number;
  isSuperchargedSession?: boolean;
}

export function DailyQuests({
  focusMinutesToday = 0,
  focusSessionsToday = 0,
  streak = 0,
  isSuperchargedSession = false,
}: DailyQuestsProps) {
  const [quests] = useState<Quest[]>(getDailyQuests);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);

  // Restore completions from localStorage
  useEffect(() => {
    const key = getStorageKey();
    const stored = localStorage.getItem(key);
    if (stored) {
      setCompleted(new Set(JSON.parse(stored)));
    }
  }, []);

  // Auto-detect progress and mark quests complete
  const checkProgress = useCallback(() => {
    const newCompleted = new Set(completed);

    quests.forEach((quest) => {
      if (newCompleted.has(quest.id)) return;

      let progress = 0;
      switch (quest.type) {
        case "focus_time":
          progress = focusMinutesToday;
          break;
        case "focus_sessions":
          progress = focusSessionsToday;
          break;
        case "streak":
          progress = focusSessionsToday >= 1 ? 1 : 0;
          break;
        case "supercharge":
          progress = isSuperchargedSession ? 1 : 0;
          break;
      }

      if (progress >= quest.target) {
        newCompleted.add(quest.id);
      }
    });

    if (newCompleted.size !== completed.size) {
      setCompleted(newCompleted);
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify([...newCompleted]));
    }
  }, [
    quests,
    focusMinutesToday,
    focusSessionsToday,
    isSuperchargedSession,
    completed,
  ]);

  useEffect(() => {
    checkProgress();
  }, [checkProgress]);

  const completedCount = completed.size;
  const totalCount = quests.length;

  const getProgress = (quest: Quest): number => {
    switch (quest.type) {
      case "focus_time":
        return Math.min(focusMinutesToday, quest.target);
      case "focus_sessions":
        return Math.min(focusSessionsToday, quest.target);
      case "streak":
        return focusSessionsToday >= 1 ? 1 : 0;
      case "supercharge":
        return isSuperchargedSession ? 1 : 0;
      default:
        return 0;
    }
  };

  return (
    <div className="w-full">
      {/* Header Toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-neutral-800 dark:text-white">
              Daily Quests
            </p>
            <p className="text-xs text-neutral-400">
              {completedCount}/{totalCount} complete
            </p>
          </div>
        </div>

        {/* Progress Orbs */}
        <div className="flex items-center gap-1.5">
          {quests.map((q) => (
            <div
              key={q.id}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                completed.has(q.id)
                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]"
                  : "bg-neutral-200 dark:bg-neutral-700"
              }`}
            />
          ))}
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            className="ml-2 text-neutral-400 text-xs"
          >
            ▼
          </motion.div>
        </div>
      </button>

      {/* Quest List */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-2 pt-2">
              {quests.map((quest, i) => {
                const progress = getProgress(quest);
                const isComplete = completed.has(quest.id);
                const pct = Math.min((progress / quest.target) * 100, 100);

                return (
                  <motion.div
                    key={quest.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative overflow-hidden px-4 py-3 rounded-2xl border transition-all ${
                      isComplete
                        ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/50 dark:border-emerald-500/20"
                        : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800"
                    }`}
                  >
                    {/* Progress bar background */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-500/10"
                    />

                    <div className="relative flex items-center gap-3">
                      {/* Icon */}
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isComplete
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          quest.icon
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-bold leading-tight ${
                            isComplete
                              ? "text-emerald-600 dark:text-emerald-400 line-through opacity-70"
                              : "text-neutral-800 dark:text-white"
                          }`}
                        >
                          {quest.title}
                        </p>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          {quest.description}
                        </p>
                        {/* Progress text */}
                        {!isComplete && quest.target > 1 && (
                          <p className="text-[10px] font-bold text-indigo-400 mt-0.5">
                            {progress}/{quest.target}
                          </p>
                        )}
                      </div>

                      {/* Reward Badge */}
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] font-black text-amber-500">
                          +{quest.rewardXp} XP
                        </div>
                        <div className="text-[10px] font-black text-emerald-500">
                          +{quest.rewardGd} G$
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* All Done Banner */}
            <AnimatePresence>
              {completedCount === totalCount && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-2 px-4 py-3 rounded-2xl bg-linear-to-r from-emerald-500/10 to-indigo-500/10 border border-emerald-500/20 text-center"
                >
                  <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">
                    🎉 All Quests Complete! See you tomorrow.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
