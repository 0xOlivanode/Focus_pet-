"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Trophy, RefreshCw, Clock, Users,
  Flame, Star, ChevronUp,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { InviteButton } from "@/components/InviteButton";
import { useAuth } from "@/hooks/useAuth";
import { COMPETITION, getCompetitionStatus, type CompetitionStatus } from "@/config/competition";
import type { CompetitionEntry } from "@/app/api/competition/leaderboard/route";

// ── Mock preview (set false before go-live) ───────────────────────────────────
const MOCK_MODE = false;

const MOCK_ENTRIES: CompetitionEntry[] = [
  { rank: 1, address: "0xAbCd1234EF567890abcd1234ef567890ABCD1234", username: "zenmaster", petName: "Blaze", compXp: 4200, compFocusTime: 18340, compSessions: 14, compStreak: 5, compReferrals: 3, points: 14540 },
  { rank: 2, address: "0x1111222233334444555566667777888899990000", username: "nightowl", petName: "Nova", compXp: 3800, compFocusTime: 15600, compSessions: 12, compStreak: 5, compReferrals: 1, points: 11960 },
  { rank: 3, address: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", username: "focusking", petName: "Titan", compXp: 3100, compFocusTime: 13200, compSessions: 10, compStreak: 4, compReferrals: 2, points: 10420 },
  { rank: 4, address: "0xaaaa1111bbbb2222cccc3333dddd4444eeee5555", username: "grindset", petName: "Rex", compXp: 2700, compFocusTime: 11400, compSessions: 9, compStreak: 4, compReferrals: 0, points: 8244 },
  { rank: 5, address: "0x9999888877776666555544443333222211110000", username: "flowstate", petName: "Aura", compXp: 2300, compFocusTime: 9800, compSessions: 8, compStreak: 3, compReferrals: 1, points: 7390 },
  { rank: 6, address: "0x1234567890abcdef1234567890abcdef12345678", username: "quietforce", petName: "Vex", compXp: 1900, compFocusTime: 8200, compSessions: 7, compStreak: 3, compReferrals: 0, points: 5282 },
  { rank: 7, address: "0xfeedfeedfeedfeedfeedfeedfeedfeedfeedfeed", username: "", petName: "Ghost", compXp: 1600, compFocusTime: 6900, compSessions: 6, compStreak: 2, compReferrals: 1, points: 4572 },
  { rank: 8, address: "0xcafe000011112222333344445555666677778888", username: "deepwork", petName: "Shard", compXp: 1200, compFocusTime: 5100, compSessions: 5, compStreak: 2, compReferrals: 0, points: 3240 },
  { rank: 9, address: "0x0101010101010101010101010101010101010101", username: "latenight", petName: "Crypt", compXp: 900, compFocusTime: 3800, compSessions: 4, compStreak: 1, compReferrals: 0, points: 1980 },
  { rank: 10, address: "0xf0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0f0", username: "starter", petName: "Pip", compXp: 500, compFocusTime: 1800, compSessions: 2, compStreak: 1, compReferrals: 0, points: 1000 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatHours(seconds: number) {
  if (!seconds) return "0m";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 1) return `${h}h ${m > 0 ? `${m}m` : ""}`.trim();
  return `${m}m`;
}

function formatAddress(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatXp(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

function formatLocalTs(ts: number) {
  return new Date(ts * 1000).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function rankMedal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return null;
}

// ── Countdown ─────────────────────────────────────────────────────────────────

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };

function useCountdown(targetTs: number): TimeLeft {
  const calc = () => {
    const diff = Math.max(0, targetTs - Math.floor(Date.now() / 1000));
    return {
      days: Math.floor(diff / 86400),
      hours: Math.floor((diff % 86400) / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
    };
  };
  const [time, setTime] = useState<TimeLeft>(calc);
  useEffect(() => {
    const id = setInterval(() => setTime(calc()), 1000);
    return () => clearInterval(id);
  }, [targetTs]);
  return time;
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#111111] border border-neutral-800 rounded-2xl flex items-center justify-center">
        <span className="text-2xl sm:text-3xl font-black text-white tabular-nums">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
        {label}
      </span>
    </div>
  );
}

// ── Formula badge ─────────────────────────────────────────────────────────────

function FormulaBadge() {
  return (
    <div className="bg-[#111111] border border-neutral-800 rounded-2xl p-4 sm:p-5">
      <p className="text-[#A9A9A9] text-xs font-semibold uppercase tracking-widest mb-3">
        How points are calculated
      </p>
      <div className="font-mono text-sm text-white mb-3 leading-relaxed">
        <span className="text-[#C48E57]">XP</span>
        <span className="text-neutral-500"> × </span>
        <span className="text-[#d4a26a]">(1 + streak × 0.2)</span>
        <span className="text-neutral-500"> + </span>
        <span className="text-[#C48E57]">sessions</span>
        <span className="text-neutral-500"> × </span>
        <span className="text-white">200</span>
        <span className="text-neutral-500"> + </span>
        <span className="text-[#C48E57]">referrals</span>
        <span className="text-neutral-500"> × </span>
        <span className="text-white">1500</span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {[
          { label: "5-day streak", desc: "2× your XP score", color: "text-[#C48E57]" },
          { label: "Per session", desc: "+200 pts", color: "text-[#C48E57]" },
          { label: "Per referral", desc: "+1,500 pts", color: "text-[#C48E57]" },
        ].map((tip) => (
          <div key={tip.label} className="bg-[#0d0d0d] border border-neutral-800/60 rounded-xl p-2.5">
            <p className={`font-bold ${tip.color}`}>{tip.desc}</p>
            <p className="text-neutral-600 mt-0.5">{tip.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Leaderboard table ─────────────────────────────────────────────────────────

function LeaderboardTable({
  entries,
  userAddress,
}: {
  entries: CompetitionEntry[];
  userAddress?: string;
}) {
  const headers = ["#", "Focuser", "XP", "Time", "Sessions", "Streak", "Refs", "Points"];

  return (
    <div className="rounded-2xl border border-neutral-800 overflow-hidden">
      {/* Desktop header */}
      <div className="hidden sm:grid grid-cols-[56px_1fr_72px_80px_80px_72px_56px_88px] px-5 py-3 border-b border-neutral-800 bg-[#0d0d0d]">
        {headers.map((h) => (
          <span key={h} className="text-neutral-600 text-xs font-semibold uppercase tracking-wide">
            {h}
          </span>
        ))}
      </div>

      <div className="divide-y divide-neutral-800/50">
        {entries.map((entry, i) => {
          const isMe = userAddress && entry.address.toLowerCase() === userAddress.toLowerCase();
          const medal = rankMedal(entry.rank);

          return (
            <motion.div
              key={entry.address}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className={`grid grid-cols-[48px_1fr] sm:grid-cols-[56px_1fr_72px_80px_80px_72px_56px_88px] items-center px-5 py-3.5 gap-3 sm:gap-0 transition-colors ${
                isMe
                  ? "bg-[#C48E5708] border-l-2 border-l-[#C48E57]/40"
                  : entry.rank <= 3
                  ? "bg-[#C48E5705]"
                  : "hover:bg-white/[0.015]"
              }`}
            >
              {/* Rank */}
              <div className="flex items-center">
                {medal ? (
                  <span className="text-lg leading-none">{medal}</span>
                ) : (
                  <span className="text-neutral-500 text-sm font-semibold tabular-nums">
                    {entry.rank}
                  </span>
                )}
              </div>

              {/* Focuser */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-semibold truncate">
                    {entry.username || formatAddress(entry.address)}
                  </span>
                  {isMe && (
                    <span className="text-[10px] bg-[#C48E5720] text-[#C48E57] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-tight shrink-0">
                      you
                    </span>
                  )}
                </div>
                {/* Mobile secondary row */}
                <div className="flex items-center gap-2.5 mt-0.5 sm:hidden text-[11px] text-neutral-500 flex-wrap">
                  <span>{formatXp(entry.compXp)} XP</span>
                  <span>·</span>
                  <span>{entry.compSessions} sessions</span>
                  <span>·</span>
                  <span className="text-[#C48E57] font-semibold">{entry.compStreak}🔥</span>
                  <span>·</span>
                  <span>· {entry.compReferrals} refs</span>
                  <span>·</span>
                  <span className="text-[#C48E57] font-bold">{entry.points.toLocaleString()} pts</span>
                </div>
              </div>

              {/* Desktop-only columns */}
              <div className="hidden sm:block">
                <span className="text-neutral-300 text-sm tabular-nums">{formatXp(entry.compXp)}</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-neutral-300 text-sm tabular-nums">{formatHours(entry.compFocusTime)}</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-neutral-300 text-sm tabular-nums">{entry.compSessions}</span>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                <Flame size={12} className={entry.compStreak > 0 ? "text-[#C48E57]" : "text-neutral-700"} />
                <span className={`text-sm tabular-nums ${entry.compStreak > 0 ? "text-[#C48E57]" : "text-neutral-700"}`}>
                  {entry.compStreak}
                </span>
              </div>
              <div className="hidden sm:block">
                <span className="text-neutral-300 text-sm tabular-nums">{entry.compReferrals}</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-[#C48E57] text-sm font-black tabular-nums">
                  {entry.points.toLocaleString()}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CompetitionPage() {
  const { isAuthenticated, isReady, address } = useAuth();
  const router = useRouter();

  const [status, setStatus] = useState<CompetitionStatus>(MOCK_MODE ? "live" : getCompetitionStatus);
  const [entries, setEntries] = useState<CompetitionEntry[]>(MOCK_MODE ? MOCK_ENTRIES : []);
  const [isLoading, setIsLoading] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const countdownTarget = status === "upcoming" ? COMPETITION.startTs : COMPETITION.endTs;
  const timeLeft = useCountdown(countdownTarget);

  // Re-evaluate status every 30s (handles transition from upcoming→live→ended)
  useEffect(() => {
    const id = setInterval(() => setStatus(getCompetitionStatus()), 30_000);
    return () => clearInterval(id);
  }, []);

  const fetchLeaderboard = useCallback(async (force = false) => {
    if (MOCK_MODE || status === "upcoming") return;
    if (force) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/competition/leaderboard");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setEntries(data.entries ?? []);
      setCachedAt(data.cachedAt ?? null);
    } catch {
      setError("Could not load leaderboard. Try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [status]);

  // Initial fetch + 5-min auto-refresh during live
  useEffect(() => {
    fetchLeaderboard();
    if (status !== "live") return;
    const id = setInterval(() => fetchLeaderboard(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [fetchLeaderboard, status]);

  if (!isReady) return null;
  if (!isAuthenticated) { router.replace("/"); return null; }

  const userEntry = entries.find(
    (e) => address && e.address.toLowerCase() === address.toLowerCase(),
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar onOpenProfile={() => router.push("/app?openProfile=true")} />

      <div className="px-5 sm:px-8 lg:px-[80px] py-10 max-w-5xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {status === "ended" && (
                <div className="flex items-center gap-1.5 bg-neutral-800/50 border border-neutral-700 px-3 py-1 rounded-full mb-2 w-fit">
                  <Trophy size={11} className="text-[#C48E57]" />
                  <span className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                    Ended
                  </span>
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-none mb-2">
                Focus{" "}
                <span className="text-[#C48E57]">
                  Blitz
                </span>
              </h1>
              <p className="text-neutral-500 text-sm font-medium">
                {COMPETITION.tagline}
              </p>
              <p className="text-neutral-700 text-xs mt-1">
                {formatLocalTs(COMPETITION.startTs)} — {formatLocalTs(COMPETITION.endTs)}
              </p>
            </div>

            <InviteButton variant="gold" />
          </div>
        </div>

        {/* ── UPCOMING: Countdown ── */}
        {status === "upcoming" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Countdown card */}
            <div className="bg-[#111111] border border-neutral-800 rounded-3xl p-6 sm:p-8">
              <p className="text-[#A9A9A9] text-xs font-semibold uppercase tracking-widest mb-6 text-center">
                Competition starts in
              </p>
              <div className="flex items-center justify-center gap-3 sm:gap-5">
                <CountdownUnit value={timeLeft.days} label="Days" />
                <span className="text-neutral-700 text-2xl font-black mb-5">:</span>
                <CountdownUnit value={timeLeft.hours} label="Hours" />
                <span className="text-neutral-700 text-2xl font-black mb-5">:</span>
                <CountdownUnit value={timeLeft.minutes} label="Mins" />
                <span className="text-neutral-700 text-2xl font-black mb-5">:</span>
                <CountdownUnit value={timeLeft.seconds} label="Secs" />
              </div>
            </div>

            {/* What to expect */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: <Clock size={18} className="text-[#C48E57]" />, title: "5 Days", desc: "May 4 – May 8, compete nonstop" },
                { icon: <Star size={18} className="text-[#C48E57]" />, title: "Streak Bonus", desc: "Perfect attendance doubles your XP score" },
                { icon: <Users size={18} className="text-[#C48E57]" />, title: "Referrals Count", desc: "Each friend you bring = +1,500 pts" },
              ].map((card) => (
                <div
                  key={card.title}
                  className="bg-[#111111] border border-neutral-800 rounded-2xl p-4 flex flex-col gap-2"
                >
                  {card.icon}
                  <p className="text-white font-bold text-sm">{card.title}</p>
                  <p className="text-neutral-600 text-xs leading-relaxed">{card.desc}</p>
                </div>
              ))}
            </div>

            <FormulaBadge />
          </motion.div>
        )}

        {/* ── LIVE / ENDED: Leaderboard ── */}
        {(status === "live" || status === "ended") && (
          <div className="space-y-5">
            {/* Time remaining / ended banner */}
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                {status === "live" ? (
                  <div className="flex items-center gap-2.5">
                    <Clock size={14} className="text-neutral-500" />
                    <span className="text-neutral-500 text-sm">
                      Ends in{" "}
                      <span className="text-white font-semibold tabular-nums">
                        {timeLeft.days > 0 && `${timeLeft.days}d `}
                        {timeLeft.hours}h {timeLeft.minutes}m
                      </span>
                    </span>
                  </div>
                ) : (
                  <p className="text-neutral-500 text-sm">
                    Competition ended · Final standings
                  </p>
                )}
                {cachedAt && (
                  <p className="text-neutral-700 text-xs mt-0.5">
                    Updated {Math.round((Date.now() - cachedAt) / 60000)}m ago
                  </p>
                )}
              </div>

              {status === "live" && (
                <button
                  onClick={() => fetchLeaderboard(true)}
                  disabled={isRefreshing}
                  className="flex items-center gap-1.5 bg-[#111111] hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white px-3 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
                  Refresh
                </button>
              )}
            </div>

            {/* Your position card */}
            {userEntry && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 px-5 py-4 bg-[#C48E5708] border border-[#C48E57]/20 rounded-2xl"
              >
                <div className="flex items-center gap-1">
                  {rankMedal(userEntry.rank) ? (
                    <span className="text-xl">{rankMedal(userEntry.rank)}</span>
                  ) : (
                    <span className="inline-flex items-center justify-center min-w-[44px] h-8 px-3 bg-[#C48E57] text-black text-xs font-black rounded-full tabular-nums">
                      #{userEntry.rank}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-semibold">Your position</p>
                  <p className="text-neutral-500 text-xs tabular-nums mt-0.5">
                    {formatXp(userEntry.compXp)} XP · {userEntry.compSessions} sessions · {userEntry.compStreak}🔥 streak
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[#C48E57] font-black text-lg tabular-nums">
                    {userEntry.points.toLocaleString()}
                  </p>
                  <p className="text-neutral-600 text-[10px] uppercase tracking-wide">pts</p>
                </div>
              </motion.div>
            )}

            {/* Formula */}
            <FormulaBadge />

            {/* Loading */}
            {isLoading && (
              <div className="rounded-2xl border border-neutral-800 overflow-hidden divide-y divide-neutral-800/50">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
                    <div className="w-8 h-6 bg-neutral-800 rounded" />
                    <div className="flex-1 h-4 bg-neutral-800 rounded" />
                    <div className="w-16 h-4 bg-neutral-800 rounded hidden sm:block" />
                    <div className="w-12 h-4 bg-neutral-800 rounded hidden sm:block" />
                    <div className="w-16 h-4 bg-neutral-800 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && !isLoading && (
              <div className="text-center py-12 text-neutral-600">
                <p className="text-sm mb-3">{error}</p>
                <button
                  onClick={() => fetchLeaderboard(true)}
                  className="text-xs text-neutral-500 hover:text-white underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Leaderboard */}
            {!isLoading && !error && entries.length > 0 && (
              <LeaderboardTable entries={entries} userAddress={address ?? undefined} />
            )}

            {!isLoading && !error && entries.length === 0 && (
              <div className="text-center py-16 text-neutral-600">
                <Zap size={32} className="mx-auto mb-3 text-neutral-800" />
                <p className="text-sm">No sessions recorded yet.</p>
                <p className="text-xs mt-1">Be the first to focus!</p>
              </div>
            )}

            {/* Scroll to top */}
            {entries.length > 20 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-400 text-xs transition-colors"
                >
                  <ChevronUp size={14} />
                  Back to top
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
