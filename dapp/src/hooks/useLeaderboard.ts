import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { useAuth } from "@/hooks/useAuth";
import { fetchLeaderboard } from "@/lib/subgraph";
import {
  UBI_POOL_ADDRESS_CELO,
} from "@/config/contracts";
import {
  G_DOLLAR_CELO,
  SUPERFLUID_FORWARDER_CELO,
  CFAv1ForwarderAbi,
} from "@/lib/superfluid";
import { CONTRACT_ADDRESS } from "@/config/contracts";
import { FocusPetABI } from "@/config/abi";

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
  const { address: accountAddress } = useAuth();

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [topTen, setTopTen] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLeaderboardData = useCallback(async () => {
    try {
      setIsLoading(true);

      // ─── 1. Fetch core leaderboard from subgraph (instant, no log scanning) ───
      const { users, totalUsers: total } = await fetchLeaderboard(100, 0);
      setTotalUsers(total);

      if (users.length === 0) {
        setLeaderboard([]);
        setTopTen([]);
        setUserEntry(null);
        return;
      }

      // Map subgraph data to LeaderboardEntry — immediately usable for render
      const baseEntries: LeaderboardEntry[] = users.map((u, i) => ({
        rank: i + 1,
        address: u.id,
        xp: Number(u.xp),
        health: Number(u.health),
        username: u.username || undefined,
        streak: Number(u.streak),
        totalFocusTime: Number(u.totalFocusTime),
      }));

      // Inject current user if not in top 100
      const allEntries = [...baseEntries];
      if (
        accountAddress &&
        !baseEntries.some(
          (e) => e.address.toLowerCase() === accountAddress.toLowerCase(),
        )
      ) {
        // User is outside top 100 — append them unranked so the UI can show their position
        allEntries.push({
          rank: 0,
          address: accountAddress.toLowerCase(),
          xp: 0,
          health: 0,
        });
      }

      setLeaderboard(baseEntries);
      setTopTen(baseEntries.slice(0, 10));

      // Set user entry from base data right away so it renders without waiting
      if (accountAddress) {
        const found = allEntries.find(
          (e) => e.address.toLowerCase() === accountAddress.toLowerCase(),
        );
        if (found) setUserEntry(found);
      }

      // ─── 2. Enrich top 10 with Superfluid flow rates (one multicall) ────────
      // Done after initial render so the leaderboard is never blocked by this.
      if (!publicClient) return;

      const enrichTargets = baseEntries.slice(0, 10);
      if (accountAddress) {
        const inTop10 = enrichTargets.some(
          (e) => e.address.toLowerCase() === accountAddress.toLowerCase(),
        );
        if (!inTop10) {
          const userBase = allEntries.find(
            (e) => e.address.toLowerCase() === accountAddress.toLowerCase(),
          );
          if (userBase) enrichTargets.push(userBase);
        }
      }

      const flowCalls = enrichTargets.map((entry) => ({
        address: SUPERFLUID_FORWARDER_CELO,
        abi: CFAv1ForwarderAbi,
        functionName: "getFlowInfo" as const,
        args: [
          G_DOLLAR_CELO,
          entry.address as `0x${string}`,
          UBI_POOL_ADDRESS_CELO,
        ],
      }));

      const flowResults = await publicClient.multicall({ contracts: flowCalls });

      const enrichedEntries = enrichTargets.map((entry, i) => {
        const result = flowResults[i];
        const flowRate =
          result.status === "success"
            ? ((result.result as any)?.[1] ?? 0n)
            : 0n;
        return { ...entry, flowRate };
      });

      // Merge enriched top-10 (+ user) back into the full leaderboard
      const enrichedMap = new Map(enrichedEntries.map((e) => [e.address, e]));
      const finalLeaderboard = baseEntries.map(
        (e) => enrichedMap.get(e.address) ?? e,
      );

      setLeaderboard(finalLeaderboard);
      setTopTen(finalLeaderboard.slice(0, 10));

      if (accountAddress) {
        const personal =
          enrichedMap.get(accountAddress.toLowerCase()) ??
          finalLeaderboard.find(
            (e) => e.address.toLowerCase() === accountAddress.toLowerCase(),
          );
        if (personal) setUserEntry(personal);
      }

      // ─── 3. Enrich top 10 with isVerified (async, non-blocking) ────────────
      enrichIsVerified(enrichTargets, enrichedMap, finalLeaderboard);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setIsLoading(false);
    }

    async function enrichIsVerified(
      targets: LeaderboardEntry[],
      enrichedMap: Map<string, LeaderboardEntry>,
      currentLeaderboard: LeaderboardEntry[],
    ) {
      try {
        const { ClaimSDK } = await import("@goodsdks/citizen-sdk");

        const verifiedResults = await Promise.allSettled(
          targets.map(async (entry) => {
            try {
              const sdk = new ClaimSDK({
                account: entry.address as `0x${string}`,
                env: "production",
                publicClient: publicClient as any,
                walletClient: {} as any,
                identitySDK: {} as any,
              });
              const status = await sdk.getWalletClaimStatus();
              return {
                address: entry.address,
                isVerified: status.status !== "not_whitelisted",
              };
            } catch {
              return { address: entry.address, isVerified: false };
            }
          }),
        );

        const verifiedMap = new Map(
          verifiedResults
            .filter((r) => r.status === "fulfilled")
            .map((r) => [
              (r as PromiseFulfilledResult<any>).value.address,
              (r as PromiseFulfilledResult<any>).value.isVerified,
            ]),
        );

        setLeaderboard((prev) =>
          prev.map((e) =>
            verifiedMap.has(e.address)
              ? { ...e, isVerified: verifiedMap.get(e.address) }
              : e,
          ),
        );
        setTopTen((prev) =>
          prev.map((e) =>
            verifiedMap.has(e.address)
              ? { ...e, isVerified: verifiedMap.get(e.address) }
              : e,
          ),
        );
        setUserEntry((prev) =>
          prev && verifiedMap.has(prev.address)
            ? { ...prev, isVerified: verifiedMap.get(prev.address) }
            : prev,
        );
      } catch {
        // isVerified is display-only — silently skip on error
      }
    }
  }, [publicClient, accountAddress]);

  // Initial fetch
  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  // Poll every 30s for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboardData();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchLeaderboardData]);

  return {
    leaderboard,
    topTen,
    userEntry,
    totalUsers,
    isLoading,
    refetch: fetchLeaderboardData,
  };
}
