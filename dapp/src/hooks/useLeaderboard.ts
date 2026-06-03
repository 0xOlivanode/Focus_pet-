import { useState, useEffect, useCallback } from "react";
import { usePublicClient } from "wagmi";
import { useAuth } from "@/hooks/useAuth";
import { fetchLeaderboard, fetchSubgraphUser } from "@/lib/subgraph";
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

// Module-level — survives re-renders and 30-second polls for the entire browser
// session. GoodDollar verification status changes rarely (verified = stays
// verified), so checking once per session is accurate enough and eliminates
// 11 sequential RPC calls on every 30-second poll.
const verifiedCache = new Map<string, boolean>();

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
      const userInTop100 = accountAddress && baseEntries.some(
        (e) => e.address.toLowerCase() === accountAddress.toLowerCase(),
      );

      if (accountAddress && !userInTop100) {
        // User is outside top 100 — fetch their real stats so we can show XP/streak
        try {
          const userData = await fetchSubgraphUser(accountAddress);
          const outsideEntry: LeaderboardEntry = userData
            ? {
                rank: 0,
                address: accountAddress.toLowerCase(),
                xp: Number(userData.xp),
                health: Number(userData.health),
                username: userData.username || undefined,
                streak: Number(userData.streak),
                totalFocusTime: Number(userData.totalFocusTime),
              }
            : { rank: 0, address: accountAddress.toLowerCase(), xp: 0, health: 0 };
          allEntries.push(outsideEntry);
          setUserEntry(outsideEntry);
        } catch {
          const stub: LeaderboardEntry = { rank: 0, address: accountAddress.toLowerCase(), xp: 0, health: 0 };
          allEntries.push(stub);
          setUserEntry(stub);
        }
      }

      setLeaderboard(baseEntries);
      setTopTen(baseEntries.slice(0, 10));

      // Set user entry from base data right away so it renders without waiting
      if (accountAddress && userInTop100) {
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
      enrichIsVerified(enrichTargets);
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setIsLoading(false);
    }

    async function enrichIsVerified(targets: LeaderboardEntry[]) {
      // Only check addresses not already in the session cache. On the first
      // call this is all 11 addresses; on every subsequent 30s poll it's zero
      // (or just new entrants to the top 10), dropping RPC calls from ~11/poll
      // to effectively 0 after the first render.
      const unchecked = targets.filter(
        (e) => !verifiedCache.has(e.address.toLowerCase()),
      );

      if (unchecked.length > 0) {
        try {
          const { ClaimSDK } = await import("@goodsdks/citizen-sdk");

          const results = await Promise.allSettled(
            unchecked.map(async (entry) => {
              try {
                const sdk = new ClaimSDK({
                  account: entry.address as `0x${string}`,
                  env: "production",
                  publicClient: publicClient as any,
                  walletClient: {} as any,
                  identitySDK: {} as any,
                });
                const status = await sdk.getWalletClaimStatus();
                return { address: entry.address, isVerified: status.status !== "not_whitelisted" };
              } catch {
                return { address: entry.address, isVerified: false };
              }
            }),
          );

          for (const r of results) {
            if (r.status === "fulfilled") {
              verifiedCache.set(r.value.address.toLowerCase(), r.value.isVerified);
            }
          }
        } catch {
          // isVerified is display-only — silently skip on error
          return;
        }
      }

      // Apply the full cache (newly fetched + previously cached) to state
      setLeaderboard((prev) =>
        prev.map((e) => {
          const key = e.address.toLowerCase();
          return verifiedCache.has(key) ? { ...e, isVerified: verifiedCache.get(key) } : e;
        }),
      );
      setTopTen((prev) =>
        prev.map((e) => {
          const key = e.address.toLowerCase();
          return verifiedCache.has(key) ? { ...e, isVerified: verifiedCache.get(key) } : e;
        }),
      );
      setUserEntry((prev) => {
        if (!prev) return prev;
        const key = prev.address.toLowerCase();
        return verifiedCache.has(key) ? { ...prev, isVerified: verifiedCache.get(key) } : prev;
      });
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
