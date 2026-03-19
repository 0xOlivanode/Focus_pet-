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
import { useAccount } from "wagmi";

export type LeaderboardEntry = {
  rank: number;
  address: string;
  xp: number;
  health: number;
  username?: string;
  isVerified?: boolean;
  flowRate?: bigint;
  totalFocusTime?: number;
  streak?: number;
};

export function useLeaderboard() {
  const publicClient = usePublicClient();
  const [fullLeaderboard, setFullLeaderboard] = useState<LeaderboardEntry[]>(
    [],
  );
  const [topTen, setTopTen] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { address: accountAddress } = useAccount();

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
        const { owner, username } = log.args as any;
        if (!owner || !username) continue;
        userData[owner] = {
          ...userData[owner],
          username,
          xp: userData[owner]?.xp || 0,
          health: userData[owner]?.health || 0,
        };
      }

      for (const log of fedLogs) {
        const { owner, newHealth, newXp } = log.args as any;
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
          rank: 0,
        }))
        .sort((a, b) => b.xp - a.xp)
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
        }));

      setFullLeaderboard(allEntries);

      // 2. FETCH TOP 100 DETAILS (Multicall for Speed)
      if (allEntries.length > 0) {
        const top100 = allEntries.slice(0, 100);
        // 🏷️ Add the User themselves if they are not in the top 100
        const userInTop100 = accountAddress && top100.some(e => e.address.toLowerCase() === accountAddress.toLowerCase());
        const usersToEnrich = [...top100];
        if (accountAddress && !userInTop100) {
          const personalEntry = allEntries.find(e => e.address.toLowerCase() === accountAddress.toLowerCase());
          if (personalEntry) usersToEnrich.push(personalEntry);
        }

        // Prepare Multicall for Pet Data and Flow Info
        const calls = [
          ...usersToEnrich.map(entry => ({
            address: CONTRACT_ADDRESS,
            abi: FocusPetABI,
            functionName: "pets",
            args: [entry.address as `0x${string}`]
          })),
          ...usersToEnrich.map(entry => ({
            address: SUPERFLUID_FORWARDER_CELO,
            abi: CFAv1ForwarderAbi,
            functionName: "getFlowInfo",
            args: [G_DOLLAR_CELO, entry.address as `0x${string}`, UBI_POOL_ADDRESS_CELO]
          }))
        ];

        const multicallResults = await publicClient.multicall({ contracts: calls as any });
        
        const { ClaimSDK } = await import("@goodsdks/citizen-sdk");
        
        const enrichedList = await Promise.all(usersToEnrich.map(async (entry, i) => {
          const petDataResult = multicallResults[i].result as any;
          const flowDataResult = multicallResults[i + usersToEnrich.length].result as any;
          
          let isVerified = false;
          try {
            const sdk = new ClaimSDK({
              account: entry.address as `0x${string}`,
              env: "production",
              publicClient: publicClient as any,
              walletClient: {} as any,
              identitySDK: {} as any,
            });
            const claimStatus = await sdk.getWalletClaimStatus();
            isVerified = claimStatus.status !== "not_whitelisted";
          } catch {}

          // Correctly extract data based on ABI named outputs or array indices
          const totalFocusTime = Number(petDataResult?.totalFocusTime ?? petDataResult?.[12] ?? 0);
          const streak = Number(petDataResult?.streak ?? petDataResult?.[6] ?? 0);
          const flowRate = flowDataResult?.[1] ?? 0n;

          return {
            ...entry,
            isVerified,
            totalFocusTime,
            streak,
            flowRate
          };
        }));

        const finalTop100 = enrichedList.slice(0, 100);
        setTopTen(finalTop100.slice(0, 10));

        if (accountAddress) {
          const personal = enrichedList.find(e => e.address.toLowerCase() === accountAddress.toLowerCase());
          if (personal) setUserEntry(personal);
        }
        
        // 🔥 SYNC BACK TO FULL LEADERBOARD (Top 100)
        setFullLeaderboard(current => 
          current.map(entry => {
            const enriched = enrichedList.find(e => e.address.toLowerCase() === entry.address.toLowerCase());
            return enriched ? { ...entry, ...enriched } : entry;
          })
        );
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [publicClient, accountAddress]);

  return {
    leaderboard: fullLeaderboard,
    topTen,
    userEntry,
    isLoading,
    refetch: fetchLeaderboard,
  };
}
