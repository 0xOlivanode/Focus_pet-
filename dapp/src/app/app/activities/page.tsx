"use client";

import { useEffect, useState, useMemo } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { fetchUserHistory, UserHistory, DailyActivity } from "@/lib/subgraph";
import { getPetEmoji, getPetStage, STAGE_THRESHOLD } from "@/utils/pet";
import { useStreaming } from "@/hooks/useStreaming";
import { formatEther } from "viem";
import { motion } from "framer-motion";

// ── Helpers ────────────────────────────────────────────────────────────────────

function fmtHours(sec: number) {
  const h = sec / 3600;
  return h >= 1 ? `${h.toFixed(1)} hrs` : `${(sec / 60).toFixed(0)} min`;
}

function fmtG(wei: string) {
  return (Number(wei) / 1e18).toFixed(2);
}

const RANK_TIERS = [
  { min: 500, name: "Guardian of G$" },
  { min: 100, name: "Social Hero" },
  { min: 10, name: "Impact Maker" },
  { min: 0, name: "Focus Novice" },
];

const STAGES = [
  { label: "Egg", min: 0, max: STAGE_THRESHOLD.BABY },
  { label: "Baby", min: STAGE_THRESHOLD.BABY, max: STAGE_THRESHOLD.TEEN },
  { label: "Teen", min: STAGE_THRESHOLD.TEEN, max: STAGE_THRESHOLD.ADULT },
  { label: "Adult", min: STAGE_THRESHOLD.ADULT, max: STAGE_THRESHOLD.ELDER },
  {
    label: "Elder",
    min: STAGE_THRESHOLD.ELDER,
    max: STAGE_THRESHOLD.ELDER * 2,
  },
];

const Y_TICKS = [1500, 1700, 1000, 500, 100, 0];

// ── XP Bar Chart ───────────────────────────────────────────────────────────────

function XPChart({
  activities,
  range,
}: {
  activities: DailyActivity[];
  range: "week" | "month";
}) {
  const gains = useMemo(() => {
    const days = range === "week" ? 7 : 30;
    const slice = activities.slice(-days - 1);
    return slice.slice(1).map((a, i) => ({
      gain: Math.max(0, Number(a.xp) - Number(slice[i].xp)),
    }));
  }, [activities, range]);

  if (gains.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-neutral-600 text-sm">
        Not enough data yet — keep focusing!
      </div>
    );
  }

  const maxGain = Math.max(...gains.map((g) => g.gain), 1);
  const CHART_H = 160;

  return (
    <div className="flex gap-4 mt-4">
      {/* Bars */}
      <div className="flex-1 relative">
        {/* Y-axis gridlines */}
        {Y_TICKS.map((tick) => (
          <div
            key={tick}
            className="absolute left-0 right-0 border-t border-neutral-800/60 border-dashed"
            style={{ bottom: `${(tick / maxGain) * CHART_H}px` }}
          />
        ))}
        {/* Bars */}
        <div
          className="flex items-end gap-1.5 overflow-x-auto"
          style={{ height: `${CHART_H}px` }}
        >
          {gains.map((g, i) => (
            <div
              key={i}
              className="flex-1 min-w-[12px] bg-[#2a2a2a] hover:bg-neutral-600 rounded-sm transition-colors cursor-default shrink-0"
              style={{
                height: `${Math.max(4, (g.gain / maxGain) * CHART_H)}px`,
              }}
              title={`+${g.gain.toLocaleString()} XP`}
            />
          ))}
        </div>
      </div>

      {/* Y-axis labels */}
      <div
        className="flex flex-col justify-between text-right shrink-0"
        style={{ height: `${CHART_H}px` }}
      >
        {Y_TICKS.map((tick) => (
          <span
            key={tick}
            className="text-[11px] text-neutral-600 tabular-nums"
          >
            {tick >= 1000 ? `${tick / 1000}K` : tick}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ActivitiesPage() {
  const { address, isConnected } = useAccount();
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const { globalUbiBalance, isStreaming, flowRate, lastUpdated } =
    useStreaming();

  const [history, setHistory] = useState<UserHistory | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [xpRange, setXpRange] = useState<"week" | "month">("week");

  const [streamedDonation, setStreamedDonation] = useState(0);

  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    if (!address) return;
    fetchUserHistory(address, 60)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [address, isConnected, isReady, isAuthenticated]);

  // Live stream ticker
  useEffect(() => {
    if (!isStreaming || !flowRate || !lastUpdated) {
      setStreamedDonation(0);
      return;
    }
    const fps = parseFloat(formatEther(flowRate));
    const now = BigInt(Math.floor(Date.now() / 1000));
    const passed = now > lastUpdated ? Number(now - lastUpdated) : 0;
    setStreamedDonation(fps * passed);
    const t = setInterval(() => setStreamedDonation((p) => p + fps), 1000);
    return () => clearInterval(t);
  }, [isStreaming, flowRate, lastUpdated]);

  if (!isReady) return null;
  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  const user = history?.user;
  const activities = history?.dailyActivities ?? [];

  const xp = user ? Number(user.xp) : 0;
  const streak = user ? Number(user.streak) : 0;
  const focusTime = user ? Number(user.totalFocusTime) : 0;
  const totalDonated = user?.totalDonated ?? "0";
  const birthTime = user ? Number(user.birthTime) : 0;
  const stage = getPetStage(xp);
  const daysActive = birthTime
    ? Math.floor((Date.now() / 1000 - birthTime) / 86400)
    : 0;

  const donatedAmt = parseFloat(fmtG(totalDonated));
  const rank =
    RANK_TIERS.find((t) => donatedAmt >= t.min) ??
    RANK_TIERS[RANK_TIERS.length - 1];

  const communityLabel = globalUbiBalance
    ? parseFloat(formatEther(globalUbiBalance)).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : "0.00";

  const currentStage =
    STAGES.find((s) => focusTime >= s.min && focusTime < s.max) ?? STAGES[STAGES.length - 1];
  const stagePct = Math.min(
    100,
    ((focusTime - currentStage.min) / (currentStage.max - currentStage.min)) * 100,
  );
  const nextStage = STAGES[STAGES.indexOf(currentStage) + 1];

  const totalXPGained =
    activities.length > 1
      ? Math.max(
          0,
          Number(activities[activities.length - 1].xp) -
            Number(activities[0].xp),
        )
      : xp;

  const totalSessions = user ? Number(user.totalSessions) : 0;
  const avgPerSession =
    totalSessions > 0 ? Math.round(focusTime / totalSessions) : 0;

  const stats = [
    { label: "Total XP", value: xp.toLocaleString() },
    { label: "Focus Time", value: fmtHours(focusTime) },
    { label: "Streak", value: `${streak} days` },
    { label: "UBI Donated", value: `${fmtG(totalDonated)} G$` },
    { label: "Days Active", value: `${daysActive}` },
    {
      label: "Pet Stage",
      value: stage.charAt(0).toUpperCase() + stage.slice(1),
    },
    { label: "Sessions", value: totalSessions.toLocaleString() },
    {
      label: "Avg / Session",
      value: avgPerSession > 0 ? fmtHours(avgPerSession) : "—",
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar onOpenProfile={() => router.push("/app?openProfile=true")} />

      <div className="px-5 sm:px-8 lg:px-[80px] py-12">
        {/* ── Hero ─────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start mb-10 justify-between">
          {/* Left: title + description */}
          <div className="lg:w-[340px] shrink-0">
            <p className="text-neutral-500 text-sm mb-3">
              Your focus helps fund global UBI
            </p>
            <h1 className="text-[72px] sm:text-[88px] font-medium leading-none tracking-tight mb-6">
              Social
              <br />
              Impact
            </h1>
            <p className="text-neutral-500 text-sm leading-relaxed">
              FocusPet is built on GoodDollar, a UBI protocol serving thousands
              globally. Every focus session and purchase streams value directly
              to the pool.
            </p>
          </div>

          {/* Right: community + your total card */}
          <div className="min-w-0">
            <div className="border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-2 divide-x divide-dashed divide-neutral-700">
                {/* Community */}
                <div className="pl-10 py-[80px] pr-[160px] bg-[#0F0F0F]">
                  <p className="text-neutral-500 text-xl mb-1">Community</p>
                  <p className="text-xl sm:text-[32px] font-mono font-medium tabular-nums tracking-tight">
                    {communityLabel}{" "}
                    <span className="text-neutral-500">G$</span>
                  </p>
                </div>

                {/* Your Total */}
                <div className="px-10 py-[80px] bg-[#0C0C0C] relative">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-neutral-500 text-xl ">Your Total</p>
                    <span className="text-xs font-medium px-3 py-1.5 bg-[#1a1a1a] border border-neutral-800 rounded-full text-neutral-300">
                      {rank.name}
                    </span>
                  </div>
                  <p className="text-xl sm:text-[32px] font-mono font-medium tabular-nums tracking-tight">
                    {fmtG(totalDonated)}{" "}
                    <span className="text-neutral-500">G$</span>
                  </p>
                  {isStreaming && (
                    <p className="text-xs text-neutral-600 mt-2 tabular-nums">
                      +{streamedDonation.toFixed(4)} live
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-neutral-900 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {/* ── Stats bar ───────────────────────────────────── */}
            <div className="bg-[#111111] border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y divide-neutral-800">
                {stats.map((s) => (
                  <div key={s.label} className="px-6 py-5">
                    <p className="text-neutral-500 text-xs mb-2">{s.label}</p>
                    <p className="text-white text-xl font-medium tabular-nums">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Evolution Progress ──────────────────────────── */}
            <div className="bg-[#111111] border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-white text-sm font-medium">
                  Evolution Progress
                </span>
                <span className="text-sm font-medium px-4 py-1.5 bg-[#1a1a1a] border border-neutral-800 rounded-full text-neutral-300">
                  {currentStage.label}
                </span>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <span className="text-neutral-600 text-xs tabular-nums w-8">
                  {Math.round(stagePct)}%
                </span>
                <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stagePct}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-white rounded-full"
                  />
                </div>
                <span className="text-neutral-600 text-xs tabular-nums w-8 text-right">
                  100%
                </span>
              </div>

              {nextStage && (
                <p className="text-center text-neutral-600 text-xs mt-3">
                  {fmtHours(currentStage.max - focusTime)} to {nextStage.label}
                </p>
              )}
            </div>

            {/* ── XP Chart ────────────────────────────────────── */}
            <div className="bg-[#111111] border border-neutral-800 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-1">
                <div>
                  <p className="text-white text-sm font-medium">XP Gained</p>
                  <p className="text-white text-3xl font-medium tabular-nums mt-1">
                    {totalXPGained.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-[#1a1a1a] border border-neutral-800 rounded-full p-1">
                  {(["week", "month"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setXpRange(r)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
                        xpRange === r
                          ? "bg-neutral-700 text-white"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <XPChart activities={activities} range={xpRange} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
