"use client";

import { useState, useMemo } from "react";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { getPetEmoji, getPetStage } from "@/utils/pet";
import Link from "next/link";
import { useAccount } from "wagmi";

const ITEMS_PER_PAGE = 20;

export default function LeaderboardPage() {
  const { address: userAddress } = useAccount();
  const { leaderboard, isLoading } = useLeaderboard();
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

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  const getAvatar = (xp: number) => {
    return getPetEmoji(getPetStage(xp));
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-indigo-600 dark:text-neutral-400 dark:hover:text-indigo-400 flex items-center gap-2 mb-2 transition-colors"
            >
              ← Back to App
            </Link>
            <h1 className="text-3xl font-black text-neutral-900 dark:text-white">
              Global <span className="text-indigo-600">Leaderboard</span>
            </h1>
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
                  <th className="px-6 py-4 text-xs font-bold text-neutral-400 uppercase tracking-wider text-right">
                    XP Score
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
                    <tr
                      key={entry.address}
                      className={`hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors ${
                        userAddress &&
                        entry.address.toLowerCase() ===
                          userAddress.toLowerCase()
                          ? "bg-indigo-50/50 dark:bg-indigo-900/10"
                          : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`font-mono font-black ${
                            entry.rank <= 3
                              ? "text-yellow-500"
                              : "text-neutral-400"
                          }`}
                        >
                          #{entry.rank}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xl shadow-sm border border-white dark:border-neutral-700">
                            {getAvatar(entry.xp)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                              {entry.username
                                ? `@${entry.username}`
                                : formatAddress(entry.address)}
                            </span>
                            <span className="text-[10px] text-neutral-400 font-mono">
                              {entry.address.substring(0, 10)}...
                            </span>
                          </div>
                          {userAddress &&
                            entry.address.toLowerCase() ===
                              userAddress.toLowerCase() && (
                              <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ml-1">
                                YOU
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">
                          {entry.xp.toLocaleString()} XP
                        </span>
                      </td>
                    </tr>
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
