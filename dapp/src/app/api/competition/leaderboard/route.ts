import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchCompetitionActivities } from "@/lib/subgraph";
import { COMPETITION, calcPoints } from "@/config/competition";

export const revalidate = 0; // no static caching — we handle it ourselves

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ── In-memory cache (5-minute TTL) ───────────────────────────────────────────
let cache: { data: CompetitionEntry[]; ts: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export type CompetitionEntry = {
  rank: number;
  address: string;
  username: string;
  petName: string;
  compXp: number;
  compFocusTime: number;
  compSessions: number;
  compStreak: number;
  compReferrals: number;
  points: number;
};

// Returns the longest consecutive run of active days within the competition window.
function calcStreak(activeDayTimestamps: number[]): number {
  if (activeDayTimestamps.length === 0) return 0;

  const DAY = 86400;
  const sorted = [...new Set(activeDayTimestamps)].sort((a, b) => a - b);

  let best = 1;
  let current = 1;

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === DAY) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

async function buildLeaderboard(): Promise<CompetitionEntry[]> {
  // Fetch DailyActivity from May 3 (baseline) through May 8 (end of comp)
  const activities = await fetchCompetitionActivities(
    COMPETITION.baselineDayTs,
    COMPETITION.endDayTs,
  );

  // Group by user
  type UserBucket = {
    address: string;
    username: string;
    petName: string;
    baseline: { xp: number; focusTime: number; sessions: number } | null;
    compDays: { date: number; xp: number; focusTime: number; sessions: number }[];
  };

  const buckets = new Map<string, UserBucket>();

  for (const act of activities) {
    const userId = act.user.id.toLowerCase();
    if (!buckets.has(userId)) {
      buckets.set(userId, {
        address: act.user.address,
        username: act.user.username,
        petName: act.user.petName,
        baseline: null,
        compDays: [],
      });
    }

    const bucket = buckets.get(userId)!;
    const date = Number(act.date);
    const xp = Number(act.xp);
    const focusTime = Number(act.focusTime);
    const sessions = Number(act.totalSessions ?? 0);

    if (date === COMPETITION.baselineDayTs) {
      // May 3 — baseline snapshot before competition
      bucket.baseline = { xp, focusTime, sessions };
    } else if (date >= COMPETITION.startDayTs && date <= COMPETITION.endDayTs) {
      bucket.compDays.push({ date, xp, focusTime, sessions });
    }
  }

  // Fetch competition-window referrals from Supabase
  const compStart = new Date(COMPETITION.startTs * 1000).toISOString();
  const compEnd = new Date(COMPETITION.endTs * 1000).toISOString();

  const { data: referralRows } = await supabase
    .from("referrals")
    .select("referrer")
    .gte("created_at", compStart)
    .lte("created_at", compEnd);

  // Count referrals per referrer address
  const referralCounts = new Map<string, number>();
  for (const row of referralRows ?? []) {
    if (!row.referrer) continue;
    const key = (row.referrer as string).toLowerCase();
    referralCounts.set(key, (referralCounts.get(key) ?? 0) + 1);
  }

  // Build entries — only include users with at least 1 comp session
  const entries: CompetitionEntry[] = [];

  for (const [userId, bucket] of buckets) {
    if (bucket.compDays.length === 0) continue;

    const lastDay = bucket.compDays[bucket.compDays.length - 1];
    const base = bucket.baseline ?? { xp: 0, focusTime: 0, sessions: 0 };

    const compXp = Math.max(0, lastDay.xp - base.xp);
    const compFocusTime = Math.max(0, lastDay.focusTime - base.focusTime);
    const compSessions = Math.max(0, lastDay.sessions - base.sessions);
    const compStreak = calcStreak(bucket.compDays.map((d) => d.date));
    const compReferrals = referralCounts.get(userId) ?? 0;

    entries.push({
      rank: 0,
      address: bucket.address,
      username: bucket.username,
      petName: bucket.petName,
      compXp,
      compFocusTime,
      compSessions,
      compStreak,
      compReferrals,
      points: calcPoints(compXp, compStreak, compSessions, compReferrals),
    });
  }

  // Sort by points descending, assign ranks
  entries.sort((a, b) => b.points - a.points);
  entries.forEach((e, i) => { e.rank = i + 1; });

  return entries;
}

export async function GET() {
  try {
    const now = Date.now();

    // Serve from cache if fresh
    if (cache && now - cache.ts < CACHE_TTL) {
      return NextResponse.json({ entries: cache.data, cachedAt: cache.ts });
    }

    const entries = await buildLeaderboard();
    cache = { data: entries, ts: now };

    return NextResponse.json({ entries, cachedAt: now });
  } catch (err: any) {
    console.error("[competition/leaderboard]", err);
    return NextResponse.json(
      { error: "Failed to load competition leaderboard" },
      { status: 500 },
    );
  }
}
