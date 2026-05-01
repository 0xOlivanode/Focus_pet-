// ── Focus Blitz — May 4–8 2026 ───────────────────────────────────────────────
// All times in UTC. Nigerian time (WAT) = UTC+1.
// Start : May 4 07:00 WAT = May 4 06:00 UTC
// End   : May 8 22:00 WAT = May 8 21:00 UTC

export const COMPETITION = {
  name: "Focus Blitz",
  tagline: "5 days. 1 leaderboard. No excuses.",

  // Unix timestamps (seconds)
  startTs: 1777874400, // 2026-05-04T06:00:00Z
  endTs:   1778274000, // 2026-05-08T21:00:00Z

  // UTC day timestamps used for subgraph delta queries
  baselineDayTs: 1777766400, // 2026-05-03T00:00:00Z  — snapshot before comp
  startDayTs:    1777852800, // 2026-05-04T00:00:00Z
  endDayTs:      1778198400, // 2026-05-08T00:00:00Z

  // Points formula weights
  points: {
    streakMultiplierPerDay: 0.2,  // each streak day adds 20% to XP score
    sessionBonus: 200,            // per session
    referralBonus: 1500,          // per referral
  },
} as const;

export type CompetitionStatus = "upcoming" | "live" | "ended";

export function getCompetitionStatus(): CompetitionStatus {
  const now = Math.floor(Date.now() / 1000);
  if (now < COMPETITION.startTs) return "upcoming";
  if (now <= COMPETITION.endTs) return "live";
  return "ended";
}

export function calcPoints(
  compXp: number,
  streak: number,
  sessions: number,
  referrals: number,
): number {
  const xpScore = compXp * (1 + streak * COMPETITION.points.streakMultiplierPerDay);
  const sessionScore = sessions * COMPETITION.points.sessionBonus;
  const referralScore = referrals * COMPETITION.points.referralBonus;
  return Math.round(xpScore + sessionScore + referralScore);
}
