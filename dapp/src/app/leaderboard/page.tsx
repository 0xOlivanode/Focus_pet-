"use client";

import { useState, useMemo } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { getPetEmoji, getPetStage } from "@/utils/pet";
import Link from "next/link";
import { useAccount } from "wagmi";
import { formatEther } from "viem";
import { calculateMonthlyAmount } from "@/lib/superfluid";
import { Navbar } from "@/components/Navbar";
import { Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 20;

const formatAddress = (addr: string) => {
  return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
};

const getAvatar = (xp: number) => {
  return getPetEmoji(getPetStage(xp));
};

const LeaderboardRow = ({
  entry,
  userAddress,
}: {
  entry: any;
  userAddress: string | undefined;
}) => {
  const [copied, setCopied] = useState(false);
  const totalFocusTime = entry.totalFocusTime || 0;
  const streak = entry.streak || 0;
  const flowRate = entry.flowRate || 0n;

  const handleCopy = () => {
    navigator.clipboard.writeText(entry.address);
    setCopied(true);
    toast.success("Address copied!", {
      icon: "📋",
      style: {
        borderRadius: "10px",
        background: "#333",
        color: "#fff",
        fontSize: "12px",
      },
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getFlowBadge = (rate?: bigint) => {
    if (!rate || rate === 0n) return null;
    const monthlyAmount = Number(formatEther(calculateMonthlyAmount(rate)));
    if (monthlyAmount >= 90)
      return { class: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20" };
    if (monthlyAmount >= 45)
      return { class: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20" };
    if (monthlyAmount >= 9)
      return {
        class: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      };
    return null;
  };

  const flowBadge = getFlowBadge(flowRate);

  return (
    <tr
      className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${
        userAddress && entry.address.toLowerCase() === userAddress.toLowerCase()
          ? "bg-indigo-50/50 dark:bg-indigo-900/10"
          : ""
      }`}
    >
      <td className="px-6 py-4">
        <span
          className={`font-mono font-black ${
            entry.rank <= 3 ? "text-yellow-500" : "text-neutral-400"
          }`}
        >
          #{entry.rank}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 shrink-0 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl shadow-sm border border-white dark:border-neutral-700">
            {getAvatar(entry.xp)}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-xs lg:text-sm text-neutral-900 dark:text-neutral-100 capitalize">
                {entry.username
                  ? `@${entry.username}`
                  : formatAddress(entry.address)}
              </span>
              <button
                onClick={handleCopy}
                className="text-neutral-400 hover:text-indigo-500 transition-colors p-1 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                {copied ? (
                  <Check size={10} className="text-emerald-500" />
                ) : (
                  <Copy size={10} />
                )}
              </button>
              {entry.flowRate !== undefined &&
                entry.flowRate > 0n &&
                flowBadge && (
                  <span
                    title="Supercharged"
                    className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border ${flowBadge.class}`}
                  >
                    Supercharged
                  </span>
                )}
              {userAddress &&
                entry.address.toLowerCase() === userAddress.toLowerCase() && (
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter">
                    YOU
                  </span>
                )}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-neutral-500 font-medium whitespace-nowrap">
                {totalFocusTime >= 3600
                  ? `${(totalFocusTime / 3600).toFixed(1)} hrs`
                  : `${(totalFocusTime / 60).toFixed(1)} mins`}{" "}
                focused
              </span>
              {streak > 0 && (
                <>
                  <div className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700" />
                  <span className="text-[10px] font-bold text-amber-500 flex items-center gap-0.5 whitespace-nowrap">
                    🔥 {streak}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-right flex">
        <span className="font-mono font-black text-xs lg:text-base text-indigo-600 dark:text-indigo-400 shrink-0">
          {entry.xp.toLocaleString()} XP
        </span>
      </td>
    </tr>
  );
};

export default function LeaderboardPage() {
  const { address: userAddress } = useAccount();
  const { leaderboard, userEntry, isLoading } = useLeaderboard();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter((entry) => {
      const searchLower = search.toLowerCase();
      return (
        entry.address.toLowerCase().includes(searchLower) ||
        entry.username?.toLowerCase().includes(searchLower)
      );
    });
  }, [leaderboard, search]);

  const totalPages = Math.ceil(filteredLeaderboard.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredLeaderboard.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Navbar />
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/app"
              className="text-sm text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 flex items-center gap-2 mb-2 transition-colors"
            >
              ← Back to App
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] lg:text-3xl font-black text-neutral-900 dark:text-white">
                The <span className="text-indigo-600">Hall of Fame</span>
              </h1>
              <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                </span>
                Live
              </span>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <input
              type="text"
              placeholder="Search by username or address..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
              🔍
            </span>
          </div>
        </div>

        {/* 🏆 YOUR RANK WIDGET */}
        {userAddress && userEntry && (
          <div className="mb-6 bg-indigo-600 dark:bg-indigo-700 rounded-2xl p-4 text-white shadow-lg shadow-indigo-500/20 flex items-center justify-between overflow-hidden relative">
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl border border-white/30">
                {getAvatar(userEntry.xp)}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-xl">
                    #{userEntry.rank}
                  </span>
                  <span className="font-bold">You</span>
                  {userEntry.flowRate !== undefined &&
                    userEntry.flowRate > 0n && (
                      <span className="text-[8px] bg-white text-indigo-600 px-1.5 py-0.5 rounded-full font-black uppercase">
                        Supercharged ⚡
                      </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-indigo-100 text-xs font-medium">
                  <span>{userEntry.xp.toLocaleString()} XP</span>
                  <div className="w-1 h-1 rounded-full bg-indigo-300" />
                  <span>
                    {(userEntry.totalFocusTime || 0) >= 3600
                      ? `${((userEntry.totalFocusTime || 0) / 3600).toFixed(1)} hrs`
                      : `${((userEntry.totalFocusTime || 0) / 60).toFixed(1)} mins`}{" "}
                    focused
                  </span>
                  {userEntry.streak && userEntry.streak > 0 && (
                    <>
                      <div className="w-1 h-1 rounded-full bg-indigo-300" />
                      <span className="font-bold text-white flex items-center gap-0.5">
                        🔥 {userEntry.streak} Streak
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="absolute top-0 right-0 h-full w-48 bg-linear-to-l from-white/10 to-transparent pointer-events-none" />

            <div className="hidden sm:block relative z-10 transition-transform hover:scale-105 duration-300">
              <div className="px-5 py-3 5 backdrop-blur-xl rounded-2xl   text-center flex flex-col items-center justify-center min-w-[120px]">
                <div className="text-2xl font-black tracking-tighter text-white drop-shadow-md">
                  Top{" "}
                  {Math.max(
                    1,
                    Math.ceil(
                      (userEntry.rank / (leaderboard.length || 1)) * 100,
                    ),
                  )}
                  %
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    Focuser
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right flex">
                    <span className="shrink-0">XP Score</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800/50">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-6">
                        <div className="h-4 w-4 bg-neutral-100 dark:bg-neutral-800 rounded"></div>
                      </td>
                      <td className="px-6 py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-neutral-100 dark:bg-neutral-800 rounded-full"></div>
                          <div className="h-4 w-24 bg-neutral-100 dark:bg-neutral-800 rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-right">
                        <div className="h-4 w-12 bg-neutral-100 dark:bg-neutral-800 rounded ml-auto"></div>
                      </td>
                    </tr>
                  ))
                ) : paginatedEntries.length > 0 ? (
                  paginatedEntries.map((entry) => (
                    <LeaderboardRow
                      key={entry.address}
                      entry={entry}
                      userAddress={userAddress}
                    />
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-12 text-center text-neutral-500"
                    >
                      No results found for "{search}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-4">
              <p className="text-xs text-neutral-500">
                Showing{" "}
                {Math.min(
                  filteredLeaderboard.length,
                  (currentPage - 1) * ITEMS_PER_PAGE + 1,
                )}{" "}
                to{" "}
                {Math.min(
                  filteredLeaderboard.length,
                  currentPage * ITEMS_PER_PAGE,
                )}{" "}
                of {filteredLeaderboard.length} focusers
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }).map(
                    (_, i) => {
                      let pageNum = currentPage;
                      if (totalPages > 5) {
                        if (currentPage <= 3) pageNum = i + 1;
                        else if (currentPage >= totalPages - 2)
                          pageNum = totalPages - 4 + i;
                        else pageNum = currentPage - 2 + i;
                      } else {
                        pageNum = i + 1;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            currentPage === pageNum
                              ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                              : "hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-500"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    },
                  )}
                </div>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
