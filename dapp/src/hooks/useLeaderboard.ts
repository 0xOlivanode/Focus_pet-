import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { fetchLeaderboard, fetchSubgraphUser } from "@/lib/subgraph";

export type LeaderboardEntry = {
  rank: number;
  address: string;
  xp: number;
  health: number;
  username?: string;
  totalFocusTime?: number;
  streak?: number;
};

export function useLeaderboard() {
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
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  }, [accountAddress]);

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
