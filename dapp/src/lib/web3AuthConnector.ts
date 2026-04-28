import { createConnector } from "wagmi";
import { createWalletClient, custom, type EIP1193Provider } from "viem";
import { celo } from "wagmi/chains";

let _provider: EIP1193Provider | null = null;

export function setWeb3AuthProvider(p: EIP1193Provider | null) {
  _provider = p;
}

export function getWeb3AuthProvider(): EIP1193Provider | null {
  return _provider;
}

export const web3AuthConnector = createConnector(() => ({
  id: "web3auth",
  name: "Web3Auth",
  type: "web3auth" as const,

  async connect() {
    const provider = getWeb3AuthProvider();
    if (!provider) throw new Error("Web3Auth provider not initialised");
    const walletClient = createWalletClient({ chain: celo, transport: custom(provider) });
    const accounts = await walletClient.getAddresses();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { accounts: accounts as any, chainId: celo.id };
  },

  async disconnect() {
    setWeb3AuthProvider(null);
  },

  async getAccounts() {
    const provider = getWeb3AuthProvider();
    if (!provider) return [] as readonly `0x${string}`[];
    const walletClient = createWalletClient({ chain: celo, transport: custom(provider) });
    return walletClient.getAddresses();
  },

  async getChainId() {
    return celo.id;
  },

  async getProvider() {
    return getWeb3AuthProvider();
  },

  async isAuthorized() {
    return getWeb3AuthProvider() !== null;
  },

  onAccountsChanged() {},
  onChainChanged() {},
  onDisconnect() {},
}));
