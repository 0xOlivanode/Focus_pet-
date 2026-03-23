/**
 * Goldsky subgraph client for FocusPet.
 *
 * Set NEXT_PUBLIC_SUBGRAPH_URL in .env.local after deploying the subgraph:
 *   NEXT_PUBLIC_SUBGRAPH_URL=https://api.goldsky.com/api/public/<PROJECT_ID>/subgraphs/focuspet/1.0.0/gn
 */

const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL ?? "";

async function query<T>(
  gql: string,
  variables: Record<string, unknown> = {},
): Promise<T> {
  if (!SUBGRAPH_URL) throw new Error("NEXT_PUBLIC_SUBGRAPH_URL is not set.");

  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: gql, variables }),
  });

  if (!res.ok) throw new Error(`Subgraph request failed: ${res.status}`);

  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors[0].message);

  return json.data as T;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type SubgraphUser = {
  id: string;
  address: string;
  username: string;
  petName: string;
  xp: string;        // BigInt comes back as string from GraphQL
  health: string;
  streak: string;
  totalFocusTime: string;
  totalDonated: string;
  isActive: boolean;
};

export type SubgraphGlobalStats = {
  totalUsers: string;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

const LEADERBOARD_QUERY = /* graphql */ `
  query Leaderboard($first: Int!, $skip: Int!) {
    users(
      first: $first
      skip: $skip
      orderBy: xp
      orderDirection: desc
      where: { isActive: true }
    ) {
      id
      address
      username
      petName
      xp
      health
      streak
      totalFocusTime
      totalDonated
      isActive
    }
    globalStats(id: "global") {
      totalUsers
    }
  }
`;

/** Returns top N active users sorted by XP descending. */
export async function fetchLeaderboard(
  first = 100,
  skip = 0,
): Promise<{ users: SubgraphUser[]; totalUsers: number }> {
  const data = await query<{
    users: SubgraphUser[];
    globalStats: SubgraphGlobalStats | null;
  }>(LEADERBOARD_QUERY, { first, skip });

  return {
    users: data.users,
    totalUsers: data.globalStats ? Number(data.globalStats.totalUsers) : 0,
  };
}

const USERNAME_QUERY = /* graphql */ `
  query CheckUsername($usernameLower: String!) {
    users(
      first: 1
      where: { usernameLower: $usernameLower, isActive: true }
    ) {
      id
    }
  }
`;

/** Returns true if the username is not taken (case-insensitive). */
export async function isUsernameFreeOnSubgraph(
  username: string,
): Promise<boolean> {
  const data = await query<{ users: { id: string }[] }>(USERNAME_QUERY, {
    usernameLower: username.toLowerCase(),
  });
  return data.users.length === 0;
}

const PET_NAME_QUERY = /* graphql */ `
  query CheckPetName($petNameLower: String!) {
    users(
      first: 1
      where: { petNameLower: $petNameLower, isActive: true }
    ) {
      id
    }
  }
`;

/** Returns true if the pet name is not taken (case-insensitive). */
export async function isPetNameFreeOnSubgraph(
  petName: string,
): Promise<boolean> {
  const data = await query<{ users: { id: string }[] }>(PET_NAME_QUERY, {
    petNameLower: petName.toLowerCase(),
  });
  return data.users.length === 0;
}

const USER_QUERY = /* graphql */ `
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      address
      username
      petName
      xp
      health
      streak
      totalFocusTime
      totalDonated
      isActive
    }
  }
`;

/** Fetches a single user's subgraph data by wallet address. */
export async function fetchSubgraphUser(
  address: string,
): Promise<SubgraphUser | null> {
  const data = await query<{ user: SubgraphUser | null }>(USER_QUERY, {
    id: address.toLowerCase(),
  });
  return data.user;
}
