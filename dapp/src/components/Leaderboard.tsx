import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/hooks/useAuth";
import { SocialShare } from "./SocialShare";
import { getPetEmoji, getPetStage } from "@/utils/pet";
import { VerifiedBadge } from "./VerifiedBadge";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";

function formatXP(xp: number): string {
  if (xp >= 1_000_000) {
    const val = xp / 1_000_000;
    return `${parseFloat(val.toFixed(2))}M`;
  }
  if (xp >= 1_000) {
    const val = xp / 1_000;
    return `${parseFloat(val.toFixed(1))}K`;
  }
  return xp.toString();
}

export function Leaderboard() {
  const { address } = useAuth();
  const { topTen, isLoading, totalUsers } = useLeaderboard();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (addr: string) => {
    navigator.clipboard.writeText(addr);
    setCopiedAddress(addr);
    toast.success("Address copied!", {
      icon: "📋",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
        fontSize: "12px",
      },
    });
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const getAvatar = (xp: number) => getPetEmoji(getPetStage(xp));

  const formatAddress = (addr: string) =>
    `@${addr.substring(0, 4)}...${addr.substring(addr.length - 3)}`;


  return (
    <div className="w-full mt-8 bg-white dark:bg-neutral-900 rounded-2xl p-4 md:p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <span className="text-xl">🏆</span>
        <div>
          <h2 className="font-black text-base leading-tight">Top Focusers</h2>
          {!isLoading && totalUsers > 0 && (
            <p className="text-[10px] text-neutral-400 font-semibold uppercase tracking-widest mt-0.5">
              {totalUsers.toLocaleString()} players in the arena
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        {isLoading && (
          <div className="text-center py-8 text-neutral-400 text-sm animate-pulse">
            Loading leaderboard...
          </div>
        )}

        {!isLoading && topTen.length === 0 && (
          <div className="text-center py-8 text-neutral-400 text-sm">
            No sessions yet. Be first.
          </div>
        )}

        {topTen.map((entry) => {
          const isMe = address && entry.address.toLowerCase() === address.toLowerCase();
          const focusHrs = entry.totalFocusTime && entry.totalFocusTime >= 3600
            ? `${(entry.totalFocusTime / 3600).toFixed(1)}h`
            : `${((entry.totalFocusTime || 0) / 60).toFixed(0)}m`;
          const streak = entry.streak || 0;

          return (
            <div
              key={entry.rank}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                isMe
                  ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30"
                  : "bg-neutral-50 dark:bg-neutral-800/40"
              }`}
            >
              {/* Rank */}
              <span
                className={`w-5 shrink-0 text-center font-black text-xs ${
                  entry.rank <= 3 ? "text-yellow-500" : "text-neutral-400"
                }`}
              >
                {entry.rank <= 3 ? ["🥇","🥈","🥉"][entry.rank - 1] : `#${entry.rank}`}
              </span>

              {/* Avatar */}
              <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center text-sm shrink-0">
                {getAvatar(entry.xp)}
              </div>

              {/* Name + meta */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-xs truncate">
                    {entry.username ? `@${entry.username}` : formatAddress(entry.address)}
                  </span>
                  <button
                    onClick={() => handleCopy(entry.address)}
                    className="text-neutral-300 hover:text-indigo-500 transition-colors shrink-0"
                  >
                    {copiedAddress === entry.address
                      ? <Check size={9} className="text-emerald-500" />
                      : <Copy size={9} />}
                  </button>
                  {entry.isVerified && <VerifiedBadge size={11} />}
                  {isMe && (
                    <span className="text-[8px] bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tight shrink-0">
                      YOU
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {focusHrs} focused
                  </span>
                  {streak > 0 && (
                    <>
                      <span className="text-neutral-300 dark:text-neutral-600">·</span>
                      <span className="text-[10px] font-bold text-amber-500">
                        🔥 {streak}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* XP */}
              <div className="shrink-0 text-right">
                <span className="font-black text-sm text-indigo-600 dark:text-indigo-400 tabular-nums">
                  {formatXP(entry.xp)}
                </span>
                <span className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider">
                  XP
                </span>
              </div>
            </div>
          );
        })}

        {!isLoading && topTen.length > 0 && (
          <Link
            href="/app/leaderboard"
            className="block w-full text-center py-3 text-xs font-bold text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mt-1"
          >
            Full leaderboard →
          </Link>
        )}
      </div>
    </div>
  );
}
