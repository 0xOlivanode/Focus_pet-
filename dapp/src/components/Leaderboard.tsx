import { useLeaderboard } from "@/hooks/useLeaderboard";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { SocialShare } from "./SocialShare";

export function Leaderboard() {
  const { address } = useAccount();
  const { leaderboard, isLoading } = useLeaderboard();

  const getAvatar = (xp: number) => {
    if (xp < 100) return "🥚";
    if (xp < 500) return "🐣";
    if (xp < 2000) return "🦖";
    if (xp < 5000) return "🐉";
    return "👑";
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="w-full mt-8 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-2xl">🏆</span>
        <h2 className="font-bold text-xl">Top Focusers (All-Time)</h2>
      </div>

      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-8 text-neutral-500 animate-pulse">
            Loading leaderboard...
          </div>
        )}

        {!isLoading && leaderboard.length === 0 && (
          <div className="text-center py-8 text-neutral-500">
            No focus sessions recorded yet. Be the first!
          </div>
        )}

        {leaderboard.map((entry) => (
          <div
            key={entry.rank}
            className={`flex items-center justify-between p-3 rounded-xl ${
              // Highlight "you" if we had address context, but for now just standard
              "bg-neutral-50 dark:bg-neutral-800/50"
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
                {getAvatar(entry.xp)}
              </div>
              <div className="flex flex-col grow min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">
                    {entry.username
                      ? `@${entry.username}`
                      : formatAddress(entry.address)}
                  </span>
                  {address &&
                    entry.address.toLowerCase() === address.toLowerCase() && (
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                          YOU
                        </span>
                        <div className="inline-flex">
                          <SocialShare
                            text={`I'm ranked #${entry.rank} on the @FocusPet leaderboard! 🏆 Can you beat me? #FocusPet #Celo`}
                            className="bg-transparent"
                          />
                        </div>
                      </div>
                    )}
                </div>
                <span className="text-[10px] text-neutral-500">
                  {entry.xp} mins focused
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="block font-mono font-bold text-indigo-600 dark:text-indigo-400 text-sm">
                {entry.xp} XP
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
