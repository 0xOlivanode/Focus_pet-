import { createPublicClient, createWalletClient, custom, http, type EIP1193Provider } from "viem";
import { CHAIN } from "@/config/contracts";

const ALCHEMY_RPC = "https://celo-mainnet.g.alchemy.com/v2/YcblzW7m_-ItUCMj1Mu17";

export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(ALCHEMY_RPC),
});

export function walletClientFromProvider(provider: EIP1193Provider, account: `0x${string}`) {
  return createWalletClient({
    account,
    chain: CHAIN,
    transport: custom(provider),
  });
}
