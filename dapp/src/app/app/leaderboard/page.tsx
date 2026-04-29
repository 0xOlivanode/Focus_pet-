"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { getPetEmoji, getPetStage } from "@/utils/pet";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Search } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { motion } from "framer-motion";

const ITEMS_PER_PAGE = 20;

const formatAddress = (addr: string) =>
  `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

const formatHours = (seconds: number) => {
  if (!seconds) return "0h";
  const hrs = seconds / 3600;
  return hrs >= 1
    ? `${hrs.toFixed(0)} hrs`
    : `${(seconds / 60).toFixed(0)} min`;
};

const getPetLevel = (xp: number) => {
  const stage = getPetStage(xp);
  const map: Record<string, number> = {
    egg: 0,
    baby: 1,
    teen: 2,
    adult: 3,
    elder: 4,
  };
  return map[stage] ?? 0;
};

export default function LeaderboardPage() {
  const { isAuthenticated, isReady, address: userAddress } = useAuth();
  const { leaderboard, userEntry, isLoading, totalUsers } = useLeaderboard();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLeaderboard = useMemo(() => {
    const q = search.toLowerCase();
    return leaderboard.filter(
      (e) =>
        e.address.toLowerCase().includes(q) ||
        e.username?.toLowerCase().includes(q),
    );
  }, [leaderboard, search]);

  const totalPages = Math.ceil(filteredLeaderboard.length / ITEMS_PER_PAGE);
  const paginated = filteredLeaderboard.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const top3 = leaderboard.slice(0, 3);

  if (!isReady) return null;
  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar onOpenProfile={() => router.push("/app?openProfile=true")} />

      <div className="px-5 sm:px-8 lg:px-[80px] py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
          <div>
            <h1 className="text-3xl sm:text-[40px]/15 font-medium tracking-tight">
              Top Focusers
            </h1>
            {!isLoading && totalUsers > 0 && (
              <p className="text-neutral-600 text-sm mt-1 tabular-nums">
                {totalUsers.toLocaleString()} focusers worldwide
              </p>
            )}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-[380px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Search focusers by username or address..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 bg-[#111111] border border-neutral-800 rounded-full text-sm text-white placeholder-neutral-600 outline-none focus:border-neutral-600 transition-colors"
            />
          </div>
        </div>

        {/* Top 3 Podium */}
        {/* {!isLoading && top3.length > 0 && !search && (
          <div className="mb-8 bg-[#111111] border border-neutral-800 rounded-2xl p-6 grid grid-cols-3 gap-4">
            {[top3[1], top3[0], top3[2]].filter(Boolean).map((entry, i) => {
              const podiumOrder = [2, 1, 3];
              const rankLabel = podiumOrder[i];
              const isFirst = rankLabel === 1;
              const isMe =
                userAddress &&
                entry.address.toLowerCase() === userAddress.toLowerCase();
              return (
                <motion.div
                  key={entry.address}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-colors ${
                    isFirst
                      ? "border-white/20 bg-white/5"
                      : "border-neutral-800 bg-transparent"
                  }`}
                >
                  <div
                    className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1a1a1a] border ${isFirst ? "border-white/30" : "border-neutral-700"} flex items-center justify-center text-2xl`}
                  >
                    {getPetEmoji(getPetStage(entry.xp))}
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <p className="text-white text-xs sm:text-sm font-semibold truncate">
                      {entry.username
                        ? `@${entry.username}`
                        : formatAddress(entry.address)}
                      {isMe && (
                        <span className="ml-1 text-[10px] text-neutral-500">
                          (you)
                        </span>
                      )}
                    </p>
                    <p className="text-neutral-500 text-[11px] mt-0.5 tabular-nums">
                      {entry.xp.toLocaleString()} XP
                    </p>
                  </div>
                  <div
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      isFirst
                        ? "bg-white text-black"
                        : "bg-[#1a1a1a] text-neutral-400 border border-neutral-800"
                    }`}
                  >
                    #{rankLabel}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )} */}
        {userAddress && userEntry && userEntry.rank > 0 && (
          <div className="mt-6 flex items-center gap-4 px-5 py-4 bg-[#111111] border border-neutral-800 rounded-2xl mb-4">
            <span className="inline-flex items-center justify-center min-w-[44px] h-8 px-3 bg-white text-black text-xs font-semibold rounded-full tabular-nums shrink-0">
              #{userEntry.rank}
            </span>
            <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-neutral-700 flex items-center justify-center text-sm shrink-0">
              {getPetEmoji(getPetStage(userEntry.xp))}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {userEntry.username
                  ? `${userEntry.username}`
                  : userAddress
                    ? formatAddress(userAddress)
                    : "—"}
              </p>
              <p className="text-neutral-500 text-xs mt-0.5 tabular-nums">
                {getPetStage(userEntry.xp).charAt(0).toUpperCase() +
                  getPetStage(userEntry.xp).slice(1)}{" "}
                · {userEntry.xp.toLocaleString()} XP ·{" "}
                {formatHours(userEntry.totalFocusTime || 0)} focused
                {userEntry.streak ? (
                  <span className="inline-flex items-center gap-1 ml-1">
                    · <Image src="/streak-flame.png" width={12} height={12} alt="" className="inline" /> {userEntry.streak}
                  </span>
                ) : ""}
              </p>
            </div>
            <span className="text-neutral-600 text-xs shrink-0">
              Top{" "}
              {Math.max(
                1,
                Math.ceil(
                  (userEntry.rank / (totalUsers || leaderboard.length || 1)) *
                    100,
                ),
              )}
              %
            </span>
          </div>
        )}
        {/* Table */}
        <div className="rounded-2xl border border-neutral-800 overflow-hidden">
          {/* Column headers */}
          <div className="hidden sm:grid grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] px-6 py-3 border-b border-neutral-800">
            {["Rank", "Focuser", "Pet", "Hours", "Streaks", "XP score"].map(
              (h) => (
                <span key={h} className="text-neutral-500 text-xs font-medium">
                  {h}
                </span>
              ),
            )}
          </div>

          {/* Rows */}
          <div className="divide-y divide-neutral-800/60">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_2fr] sm:grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] items-center px-6 py-4 gap-3 sm:gap-0 animate-pulse"
                >
                  <div className="h-8 w-12 bg-neutral-800 rounded-full" />
                  <div className="h-4 w-28 bg-neutral-800 rounded" />

                  <div className="h-4 w-14 bg-neutral-800 rounded hidden sm:block" />
                  <div className="h-4 w-12 bg-neutral-800 rounded hidden sm:block" />
                  <div className="h-4 w-8 bg-neutral-800 rounded hidden sm:block" />
                  <div className="h-4 w-16 bg-neutral-800 rounded hidden sm:block" />
                </div>
              ))
            ) : paginated.length === 0 ? (
              <div className="py-16 text-center text-neutral-600 text-sm">
                No results for &ldquo;{search}&rdquo;
              </div>
            ) : (
              paginated.map((entry) => {
                const isMe =
                  userAddress &&
                  entry.address.toLowerCase() === userAddress.toLowerCase();
                const level = getPetLevel(entry.xp);
                const streak = entry.streak || 0;

                return (
                  <div
                    key={entry.address}
                    className={`grid grid-cols-[64px_1fr] sm:grid-cols-[1fr_2fr_1fr_1fr_1fr_1fr] items-center px-6 py-4 gap-3 sm:gap-0 transition-colors hover:bg-white/[0.02] ${
                      isMe ? "bg-white/[0.03]" : ""
                    }`}
                  >
                    {/* Rank */}
                    <div>
                      <span className="inline-flex items-center justify-center min-w-[44px] h-8 px-3 bg-[#1a1a1a] border border-neutral-800 rounded-full text-white text-xs font-semibold tabular-nums">
                        #{entry.rank}
                      </span>
                    </div>

                    {/* Focuser */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-white text-sm font-medium truncate capitalize">
                            {entry.username
                              ? `${entry.username}`
                              : formatAddress(entry.address)}
                          </span>
                          {entry.isVerified && <VerifiedBadge size={12} />}
                          {isMe && (
                            <span className="text-[10px] bg-white/10 text-neutral-300 px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-tight shrink-0">
                              you
                            </span>
                          )}
                        </div>
                        {/* Mobile-only secondary info */}
                        <div className="flex items-center gap-2 mt-0.5 sm:hidden">
                          <span className="text-neutral-600 text-[11px]">
                            {formatHours(entry.totalFocusTime || 0)}
                          </span>
                          {streak > 0 && (
                            <span className="inline-flex items-center gap-0.5 text-[11px] text-neutral-500">
                              <Image src="/streak-flame.png" width={12} height={12} alt="" /> {streak}
                            </span>
                          )}
                          <span className="text-neutral-500 text-[11px] font-medium tabular-nums">
                            {entry.xp.toLocaleString()} XP
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pet — desktop only */}
                    <div className="hidden sm:flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#1a1a1a] border border-neutral-800 flex items-center justify-center text-xs shrink-0">
                        {getPetEmoji(getPetStage(entry.xp))}
                      </div>
                      <span className="text-neutral-400 text-sm">
                        Lvl: {level}
                      </span>
                    </div>

                    {/* Hours — desktop only */}
                    <div className="hidden sm:block">
                      <span className="text-neutral-300 text-sm tabular-nums">
                        {formatHours(entry.totalFocusTime || 0)}
                      </span>
                    </div>

                    {/* Streak — desktop only */}
                    <div className="hidden sm:flex items-center gap-1.5">
                      {streak > 0 ? (
                        <>
                          <Image src="/streak-flame.png" width={16} height={16} alt="" />
                          <span className="text-neutral-300 text-sm tabular-nums">
                            {streak}
                          </span>
                        </>
                      ) : (
                        <span className="text-neutral-700 text-sm">—</span>
                      )}
                    </div>

                    {/* XP — desktop only */}
                    <div className="hidden sm:block">
                      <span className="text-white text-sm font-semibold tabular-nums">
                        {entry.xp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-between gap-4">
              <p className="text-xs text-neutral-600">
                {Math.min(
                  filteredLeaderboard.length,
                  (currentPage - 1) * ITEMS_PER_PAGE + 1,
                )}
                –
                {Math.min(
                  filteredLeaderboard.length,
                  currentPage * ITEMS_PER_PAGE,
                )}{" "}
                of {filteredLeaderboard.length}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-neutral-800 text-xs text-neutral-400 disabled:opacity-30 hover:border-neutral-600 transition-colors"
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                  let p = i + 1;
                  if (totalPages > 5) {
                    if (currentPage <= 3) p = i + 1;
                    else if (currentPage >= totalPages - 2)
                      p = totalPages - 4 + i;
                    else p = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                        currentPage === p
                          ? "bg-white text-black"
                          : "bg-[#1a1a1a] border border-neutral-800 text-neutral-500 hover:border-neutral-600"
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg bg-[#1a1a1a] border border-neutral-800 text-xs text-neutral-400 disabled:opacity-30 hover:border-neutral-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Your rank sticky footer */}
      </div>
    </div>
  );
}
