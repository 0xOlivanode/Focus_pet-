import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAccount } from "wagmi";
import { SocialShare } from "./SocialShare";
import { getPetEmoji, getPetStage } from "@/utils/pet";
import { VerifiedBadge } from "./VerifiedBadge";

export function Leaderboard() {
  const { address } = useAccount();
  const { leaderboard, isLoading } = useLeaderboard();

  const getAvatar = (xp: number) => {
    return getPetEmoji(getPetStage(xp));
  };

  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="w-full mt-8 bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xl md:text-2xl">🏆</span>
        <h2 className="font-bold text-lg md:text-lg">
          Top Focusers (All-Time)
        </h2>
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
            className={`flex items-center justify-between p-2 md:p-3 rounded-xl ${
              // Highlight "you" if we had address context, but for now just standard
              "bg-neutral-50 dark:bg-neutral-800/50"
            }`}
          >
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <span
                className={`w-5 md:w-6 text-center font-bold text-xs md:text-sm ${
                  entry.rank <= 3 ? "text-yellow-500" : "text-neutral-400"
                }`}
              >
                #{entry.rank}
              </span>
              <div className="w-8 h-8 md:w-10 md:h-10 bg-neutral-200 dark:bg-neutral-700 rounded-full flex items-center justify-center text-base md:text-lg shrink-0">
                {getAvatar(entry.xp)}
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="font-bold text-xs md:text-sm truncate max-w-[80px] md:max-w-none">
                    {entry.username
                      ? `@${entry.username}`
                      : formatAddress(entry.address)}
                  </span>
                  {entry.isVerified && <VerifiedBadge size={12} />}
                  {address &&
                    entry.address.toLowerCase() === address.toLowerCase() && (
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <span className="text-[8px] md:text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter shadow-sm border border-indigo-200/50 dark:border-indigo-800/50">
                          YOU
                        </span>
                        <SocialShare
                          text={`I'm ranked #${entry.rank} on the @FocusPet leaderboard! 🏆 Can you beat me? #FocusPet #Celo`}
                          // className="w-7 h-7 md:w-8 md:h-8"
                        />
                      </div>
                    )}
                </div>
                <span className="text-[9px] md:text-[10px] text-neutral-500 font-medium">
                  {entry.xp} mins focus record
                </span>
              </div>
            </div>

            <div className="text-right shrink-0 ml-2">
              <span className="block font-mono font-black text-indigo-600 dark:text-indigo-400 text-xs md:text-sm whitespace-nowrap">
                {entry.xp} XP
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
