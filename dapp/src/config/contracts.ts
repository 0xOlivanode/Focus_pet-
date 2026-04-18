export const CONTRACT_ADDRESS =
  "0x077AC6fAaE04B64b1CF8586F95D890491Bed04E7" as const;

export const GOOD_DOLLAR_ADDRESSES = {
  CELO_MAINNET: "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A",
  CELO_SEPOLIA: "0x67C5870b4A41D4Ebef24d2456547A03F1f3e094B",
} as const;

export const DEPLOYMENT_BLOCK = BigInt("59965000"); // Latest production deployment block (New Contract)

export const UBI_POOL_ADDRESS_CELO =
  "0x43d72Ff17701B2DA814620735C39C620Ce0ea4A1" as const;

// GoodDollar Engagement Rewards
// Production contract — swap for DEV_REWARDS_CONTRACT during testing.
export const ENGAGEMENT_REWARDS_CONTRACT =
  (process.env.NEXT_PUBLIC_ENGAGEMENT_REWARDS_CONTRACT ||
    "0x25db74CF4E7BA120526fd87e159CF656d94bAE43") as `0x${string}`;

// Address derived from APP_PRIVATE_KEY — the signer registered in the
// EngagementRewards contract. Set NEXT_PUBLIC_APP_ADDRESS in .env.local.
export const ENGAGEMENT_APP_ADDRESS =
  (process.env.NEXT_PUBLIC_APP_ADDRESS || "") as `0x${string}`;

// Minimum distinct focus days required to unlock engagement reward.
export const ENGAGEMENT_MIN_DAYS = 2;
