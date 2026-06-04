import { celo } from "viem/chains";

export const CHAIN = celo;

export const FOCUSPET_ADDRESS = "0x077AC6fAaE04B64b1CF8586F95D890491Bed04E7" as const;
export const USDT_ADDRESS     = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e" as const;
export const GDOLLAR_ADDRESS  = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A" as const;

export const FOCUSPET_ABI = [
  {
    name: "pets",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [
      { name: "xp",              type: "uint256" },
      { name: "health",          type: "uint256" },
      { name: "lastInteraction", type: "uint256" },
      { name: "birthTime",       type: "uint256" },
      { name: "username",        type: "string"  },
      { name: "petName",         type: "string"  },
      { name: "streak",          type: "uint256" },
      { name: "lastDailySession",type: "uint256" },
      { name: "boostEndTime",    type: "uint256" },
      { name: "shieldCount",     type: "uint256" },
      { name: "activeCosmetic",  type: "string"  },
      { name: "totalDonated",    type: "uint256" },
      { name: "totalFocusTime",  type: "uint256" },
    ],
  },
  {
    name: "migratePet",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [{ name: "newAddress", type: "address" }],
    outputs: [],
  },
] as const;

export const ERC20_ABI = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    name: "transfer",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to",    type: "address" },
      { name: "value", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
] as const;
