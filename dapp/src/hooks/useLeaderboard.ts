import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { parseAbiItem } from "viem";

const CONTRACT_ADDRESS = "0x9289F74f356271cEfe691c88963aC961C6efa422"; // Celo Mainnet

export type LeaderboardEntry = {
  rank: number;
  address: string;
  xp: number;
  health: number;
  username?: string;
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
        const [fedLogs, nameLogs] = await Promise.all([
          publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: parseAbiItem(
              "event PetFed(address indexed owner, uint256 newHealth, uint256 newXp)",
            ),
            fromBlock: BigInt(59551357),
          }),
          publicClient.getLogs({
            address: CONTRACT_ADDRESS,
            event: parseAbiItem(
              "event NamesUpdated(address indexed owner, string username, string petName)",
            ),
            fromBlock: BigInt(59551357),
          }),
        ]);

        // Aggregation: Map owner -> latest data (highest XP)
        const userData: Record<
          string,
          { xp: number; health: number; username?: string }
        > = {};

        // Parse Names first
        for (const log of nameLogs) {
          const { owner, username } = log.args;
          if (!owner || !username) continue;
          userData[owner] = {
            ...userData[owner],
            username,
            xp: userData[owner]?.xp || 0,
            health: userData[owner]?.health || 0,
          };
        }

        for (const log of fedLogs) {
          const { owner, newHealth, newXp } = log.args;
          if (!owner || newXp === undefined || newHealth === undefined)
            continue;

          const currentXp = Number(newXp);
          const currentHealth = Number(newHealth);

          if (!userData[owner] || currentXp > userData[owner].xp) {
            userData[owner] = {
              ...userData[owner],
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
            username: data.username,
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
