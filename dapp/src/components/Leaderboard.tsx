import React from "react";
import { formatEther } from "viem";

type LeaderboardEntry = {
  rank: number;
  name: string;
  avatar: string;
  minutesFocused: number;
  gEarned: string; // G$ amount (BigInt string)
};

const MOCK_DATA: LeaderboardEntry[] = [
  {
    rank: 1,
    name: "alice.eth",
    avatar: "👩‍🚀",
    minutesFocused: 1250,
    gEarned: "500000000000000000000",
  }, // 500 G$
  {
    rank: 2,
    name: "bob.lens",
    avatar: "🧙‍♂️",
    minutesFocused: 980,
    gEarned: "320000000000000000000",
  }, // 320 G$
  {
    rank: 3,
    name: "charlie.fc",
    avatar: "🧛",
    minutesFocused: 850,
    gEarned: "150000000000000000000",
  }, // 150 G$
  {
    rank: 4,
    name: "you",
    avatar: "🦅",
    minutesFocused: 25,
    gEarned: "10000000000000000000",
  }, // 10 G$
  { rank: 5, name: "dave.eth", avatar: "🧟", minutesFocused: 0, gEarned: "0" },
];

export function Leaderboard() {
  return (
    <div className="w-full mt-8 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🏆</span>
        <h2 className="font-bold text-xl">Weekly Top Focusers</h2>
      </div>

      <div className="space-y-4">
        {MOCK_DATA.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center justify-between p-3 rounded-xl ${
              entry.name === "you"
                ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800"
                : "bg-neutral-50 dark:bg-neutral-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <span
                className={`w-6 text-center font-bold ${
                  entry.rank <= 3 ? "text-yellow-500" : "text-neutral-400"
                }`}
              >
                #{entry.rank}
              </span>
              <div className="w-8 h-8 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center text-lg">
                {entry.avatar}
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{entry.name}</span>
                <span className="text-[10px] text-neutral-500">
                  {entry.minutesFocused} mins focused
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="block font-mono font-bold text-green-600 dark:text-green-400 text-sm">
                +{parseFloat(formatEther(BigInt(entry.gEarned))).toFixed(0)} G$
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
