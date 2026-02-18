import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { parseAbiItem } from "viem";

const CONTRACT_ADDRESS = "0x4514FB3ffbbC7F125c20077d04066b36232239B3"; // Celo Sepolia

export type LeaderboardEntry = {
  rank: number;
  address: string;
  xp: number;
  health: number;
};

export function useLeaderboard() {
  const publicClient = usePublicClient();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      if (!publicClient) return;

      try {
        setIsLoading(true);

        // Fetch all PetFed logs
        // We start from a recent block to save time, or 0 (earlier deployment block)
        // Since it's a testnet and fresh deploy, 0 or "earliest" is fine, but safer to use a block if known.
        // Let's use 'earliest' for now as the chain is Sepolia (fast enough).
        const logs = await publicClient.getLogs({
          address: CONTRACT_ADDRESS,
          event: parseAbiItem(
            "event PetFed(address indexed owner, uint256 newHealth, uint256 newXp)",
          ),
          fromBlock: "earliest",
        });

        // Aggregation: Map owner -> latest data (highest XP)
        const userData: Record<string, { xp: number; health: number }> = {};

        for (const log of logs) {
          const { owner, newHealth, newXp } = log.args;
          if (!owner || newXp === undefined || newHealth === undefined)
            continue;

          const currentXp = Number(newXp);
          const currentHealth = Number(newHealth);

          // Always take the entry with higher XP (progressing)
          // Or if same XP, maybe latest? logic: XP only goes up usually.
          if (!userData[owner] || currentXp > userData[owner].xp) {
            userData[owner] = {
              xp: currentXp,
              health: currentHealth,
            };
          }
        }

        // Convert to Array & Sort
        const sortedLeaderboard = Object.entries(userData)
          .map(([address, data]) => ({
            address,
            xp: data.xp,
            health: data.health,
          }))
          .sort((a, b) => b.xp - a.xp) // Descending
          .map((entry, index) => ({
            ...entry,
            rank: index + 1,
          }));

        setLeaderboard(sortedLeaderboard);
      } catch (error) {
        console.error("Failed to fetch leaderboard logs:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLeaderboard();
  }, [publicClient]);

  return { leaderboard, isLoading };
}
