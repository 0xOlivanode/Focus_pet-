"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { fetchUserHistory, UserHistory, DailyActivity } from "@/lib/subgraph";
import { getPetEmoji, getPetStage, STAGE_THRESHOLD } from "@/utils/pet";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatHours(seconds: number) {
  const h = seconds / 3600;
  return h >= 1 ? `${h.toFixed(1)} hrs` : `${(seconds / 60).toFixed(0)} min`;
}

function formatDate(unixSec: number) {
  return new Date(unixSec * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatG(wei: string) {
  return (Number(wei) / 1e18).toFixed(2);
}

// ─── XP Chart ────────────────────────────────────────────────────────────────

function XPChart({ activities }: { activities: DailyActivity[] }) {
  if (activities.length < 2) {
    return (
      <div className="flex items-center justify-center h-32 text-neutral-400 text-sm">
        Not enough data yet — keep focusing!
      </div>
    );
  }

  // Compute XP gained per day (diff of consecutive snapshots)
  const gains = activities.slice(1).map((a, i) => ({
    date: Number(activities[i + 1].date),
    gain: Math.max(0, Number(a.xp) - Number(activities[i].xp)),
  }));

  const maxGain = Math.max(...gains.map((g) => g.gain), 1);
  const BAR_MAX_H = 80; // px

  return (
    <div className="mt-2">
      <div className="flex items-end gap-1.5 h-24 overflow-x-auto pb-1 pr-1">
        {gains.map((g, i) => {
          const h = Math.max(4, (g.gain / maxGain) * BAR_MAX_H);
          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1 shrink-0 group"
              title={`${formatDate(g.date)}: +${g.gain.toLocaleString()} XP`}
            >
              <div
                className="w-5 rounded-t-sm bg-indigo-500/70 group-hover:bg-indigo-500 transition-colors cursor-default"
                style={{ height: `${h}px` }}
              />
            </div>
          );
        })}
      </div>
      {/* X-axis: first and last date */}
      <div className="flex justify-between text-[9px] text-neutral-400 mt-1 font-medium">
        <span>{formatDate(Number(gains[0].date))}</span>
        <span>{formatDate(Number(gains[gains.length - 1].date))}</span>
      </div>
    </div>
  );
}

// ─── Stage progress bar ───────────────────────────────────────────────────────

function StageProgress({ xp }: { xp: number }) {
  const stages: { label: string; min: number; max: number; emoji: string }[] = [
    { label: "Egg",   min: 0,                    max: STAGE_THRESHOLD.BABY,  emoji: "🥚" },
    { label: "Baby",  min: STAGE_THRESHOLD.BABY,  max: STAGE_THRESHOLD.TEEN,  emoji: "🐣" },
    { label: "Teen",  min: STAGE_THRESHOLD.TEEN,  max: STAGE_THRESHOLD.ADULT, emoji: "🦖" },
    { label: "Adult", min: STAGE_THRESHOLD.ADULT, max: STAGE_THRESHOLD.ELDER, emoji: "🐉" },
    { label: "Elder", min: STAGE_THRESHOLD.ELDER, max: STAGE_THRESHOLD.ELDER * 2, emoji: "👑" },
  ];

  const current = stages.find((s) => xp >= s.min && xp < s.max) ?? stages[stages.length - 1];
  const pct = Math.min(
    100,
    ((xp - current.min) / (current.max - current.min)) * 100,
  );

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
        <span className="text-neutral-500">{current.emoji} {current.label}</span>
        <span className="text-indigo-500">{Math.round(pct)}%</span>
      </div>
      <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {current.label !== "Elder" && (
        <p className="text-[10px] text-neutral-400 mt-1">
          {(current.max - xp).toLocaleString()} XP to {stages[stages.indexOf(current) + 1]?.label}
        </p>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HistoryPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [history, setHistory] = useState<UserHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
      return;
    }
    if (!address) return;

    fetchUserHistory(address, 60)
      .then((data) => {
        setHistory(data);
      })
      .catch(() => setError("Failed to load history. Try again later."))
      .finally(() => setIsLoading(false));
  }, [address, isConnected, router]);

  const user = history?.user;
  const activities = history?.dailyActivities ?? [];

  const xp           = user ? Number(user.xp) : 0;
  const streak       = user ? Number(user.streak) : 0;
  const focusTime    = user ? Number(user.totalFocusTime) : 0;
  const totalDonated = user?.totalDonated ?? "0";
  const birthTime    = user ? Number(user.birthTime) : 0;
  const stage        = getPetStage(xp);
  const petEmoji     = getPetEmoji(stage);

  const daysActive = birthTime
    ? Math.floor((Date.now() / 1000 - birthTime) / 86400)
    : 0;

  const stats = [
    { label: "Total XP",      value: xp.toLocaleString(),          icon: "⚡" },
    { label: "Focus Time",    value: formatHours(focusTime),        icon: "⏱️" },
    { label: "Streak",        value: `${streak} days`,              icon: "🔥" },
    { label: "UBI Donated",   value: `${formatG(totalDonated)} G$`, icon: "🌍" },
    { label: "Days Active",   value: `${daysActive}`,               icon: "📅" },
    { label: "Pet Stage",     value: `${petEmoji} ${stage.charAt(0).toUpperCase() + stage.slice(1)}`, icon: "" },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Navbar />

      <div className="max-w-2xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/app"
            className="text-sm text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 flex items-center gap-2 mb-3 transition-colors"
          >
            ← Back to App
          </Link>
          <h1 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white">
            Your{" "}
            <span className="text-indigo-600">Focus History</span>
          </h1>
          {user?.username && (
            <p className="text-neutral-400 font-medium mt-1 text-sm">
              @{user.username}
            </p>
          )}
        </div>

        {isLoading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse"
              />
            ))}
          </div>
        )}

        {error && (
          <div className="text-center py-16 text-neutral-500">{error}</div>
        )}

        {!isLoading && !error && !history && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🥚</div>
            <p className="text-neutral-500 font-medium">
              No pet found yet. Complete your first focus session to hatch one!
            </p>
            <Link
              href="/app"
              className="inline-block mt-6 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors"
            >
              Start Focusing
            </Link>
          </div>
        )}

        {!isLoading && !error && history && (
          <div className="space-y-6">
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-4 shadow-xs"
                >
                  <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                    {s.icon} {s.label}
                  </p>
                  <p className="text-lg font-black text-neutral-900 dark:text-white">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Stage evolution progress */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 shadow-xs">
              <h2 className="font-black text-sm text-neutral-800 dark:text-white mb-3">
                Evolution Progress
              </h2>
              <StageProgress xp={xp} />
            </div>

            {/* XP gain chart */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-black text-sm text-neutral-800 dark:text-white">
                  Daily XP Gained
                </h2>
                <span className="text-[10px] text-neutral-400 font-medium">
                  Last {activities.length} days indexed
                </span>
              </div>
              <XPChart activities={activities} />
              {activities.length === 0 && (
                <p className="text-xs text-neutral-400 text-center mt-2">
                  Chart data syncs from the blockchain — check back after your next session.
                </p>
              )}
            </div>

            {/* Impact summary */}
            <div className="bg-linear-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg shadow-indigo-500/20">
              <h2 className="font-black text-sm mb-4 opacity-80 uppercase tracking-wider">
                🌍 Your Impact
              </h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black">
                    {formatG(totalDonated)} G$
                  </p>
                  <p className="text-indigo-200 text-sm font-medium mt-1">
                    contributed to GoodDollar UBI
                  </p>
                </div>
                <div className="text-5xl">🤝</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
