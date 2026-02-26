import { useState, useEffect } from "react";
import { usePublicClient } from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { parseAbiItem } from "viem";

import {
  CONTRACT_ADDRESS,
  DEPLOYMENT_BLOCK,
  UBI_POOL_ADDRESS_CELO,
} from "@/config/contracts";
import {
  G_DOLLAR_CELO,
  SUPERFLUID_FORWARDER_CELO,
  CFAv1ForwarderAbi,
} from "@/lib/superfluid";

export type LeaderboardEntry = {
  rank: number;
  address: string;
  xp: number;
  health: number;
  username?: string;
  isVerified?: boolean;
  flowRate?: bigint;
  totalFocusTime?: number;
};

export function useLeaderboard() {
  const publicClient = usePublicClient();
  const [fullLeaderboard, setFullLeaderboard] = useState<LeaderboardEntry[]>(
    [],
  );
  const [topTen, setTopTen] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboard = async () => {
    if (!publicClient) return;

    try {
      setIsLoading(true);

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

      const userData: Record<
        string,
        { xp: number; health: number; username?: string }
      > = {};

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

      const allEntries = Object.entries(userData)
        .map(([address, data]) => ({
          address,
          xp: data.xp,
          health: data.health,
          username: data.username,
        }))
        .sort((a, b) => b.xp - a.xp)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      setFullLeaderboard(allEntries);

      // Fetch details only for Top 10
      const topTenEntries = allEntries.slice(0, 10);

      const { ClaimSDK } = await import("@goodsdks/citizen-sdk");

      const verifiedResults = await Promise.all(
        topTenEntries.map(async (entry) => {
          try {
            const sdk = new ClaimSDK({
              account: entry.address as `0x${string}`,
              env: "production",
              publicClient: publicClient as any,
              walletClient: {} as any,
              identitySDK: {} as any,
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

      setTopTen(verifiedResults);

      const withFlows = await Promise.all(
        verifiedResults.map(async (entry) => {
          try {
            const flowData = (await publicClient.readContract({
              address: SUPERFLUID_FORWARDER_CELO,
              abi: CFAv1ForwarderAbi,
              functionName: "getFlowInfo",
              args: [
                G_DOLLAR_CELO,
                entry.address as `0x${string}`,
                UBI_POOL_ADDRESS_CELO as `0x${string}`,
              ],
            })) as [bigint, bigint, bigint, bigint];

            return {
              ...entry,
              flowRate: flowData[1],
            };
          } catch {
            return entry;
          }
        }),
      );

      setTopTen(withFlows);

      const finalTopTen = await Promise.all(
        withFlows.map(async (entry) => {
          try {
            const petData = (await publicClient.readContract({
              address: CONTRACT_ADDRESS,
              abi: FocusPetABI,
              functionName: "pets",
              args: [entry.address as `0x${string}`],
            })) as unknown as any[];
            return {
              ...entry,
              totalFocusTime: Number(petData[12]),
            };
          } catch {
            return entry;
          }
        }),
      );

      setTopTen(finalTopTen);
    } catch (error) {
      console.error("Failed to fetch leaderboard logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [publicClient]);

  return {
    leaderboard: fullLeaderboard,
    topTen,
    isLoading,
    refetch: fetchLeaderboard,
  };
}
