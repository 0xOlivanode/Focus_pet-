import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { parseAbiItem } from "viem";

import { CONTRACT_ADDRESS, DEPLOYMENT_BLOCK } from "@/config/contracts";

export type LeaderboardEntry = {
  rank: number;
  address: string;
  xp: number;
  health: number;
  username?: string;
  isVerified?: boolean;
};

export function useLeaderboard() {
  const publicClient = usePublicClient();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    if (!publicClient) return;

    try {
      setIsLoading(true);

      // Fetch all PetFed logs
      // We start from a recent block to save time, or 0 (earlier deployment block)
      // Since it's a testnet and fresh deploy, 0 or "earliest" is fine, but safer to use a block if known.
      // Let's use 'earliest' for now as the chain is Sepolia (fast enough).
      const [fedLogs, nameLogs] = await Promise.all([
        publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: FocusPetABI,
          eventName: "PetFed",
          fromBlock: DEPLOYMENT_BLOCK,
        }),
        publicClient.getContractEvents({
          address: CONTRACT_ADDRESS,
          abi: FocusPetABI,
          eventName: "NamesUpdated",
          fromBlock: DEPLOYMENT_BLOCK,
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
        if (!owner || newXp === undefined || newHealth === undefined) continue;

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
        .slice(0, 10) // Only top 10 for performance
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      // Bonus: Check verification for top 10
      const { ClaimSDK } = await import("@goodsdks/citizen-sdk");

      const verifiedResults = await Promise.all(
        sortedLeaderboard.map(async (entry) => {
          try {
            // Simplified check: we use the modular SDK logic to check for 'whitelisted' status
            const sdk = new ClaimSDK({
              account: entry.address as `0x${string}`,
              env: "production",
              publicClient: publicClient as any,
              walletClient: {} as any, // Dummy for read-only
              identitySDK: {} as any, // Dummy for read-only
            });
            const claimStatus = await sdk.getWalletClaimStatus();
            return {
              ...entry,
              isVerified: claimStatus.status !== "not_whitelisted",
            };
          } catch {
            return { ...entry, isVerified: false };
          }
        }),
      );

      setLeaderboard(verifiedResults);
    } catch (error) {
      console.error("Failed to fetch leaderboard logs:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchLeaderboard();
  }, [publicClient]);

  return { leaderboard, isLoading, refetch: fetchLeaderboard };
}
