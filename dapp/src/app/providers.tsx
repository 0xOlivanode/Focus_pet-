"use client";

import * as React from "react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WagmiProvider as StandardWagmiProvider, // used for MiniPay — no Privy connector
  useConnect,
  useAccount,
  fallback,
  http,
  createConfig,
  custom as wagmiCustom,
} from "wagmi";
import { WagmiProvider as PrivyWagmiProvider } from "@privy-io/wagmi"; // used for Privy/Web3Auth
import { injected } from "wagmi/connectors";
import { PrivyProvider } from "@privy-io/react-auth";
import { celo } from "wagmi/chains";
import { AudioProvider } from "@/hooks/useAudio";
import { IdentityProvider } from "@/contexts/IdentityContext";
import { MiniPayProvider } from "@/contexts/MiniPayContext";
import { Web3AuthProvider, useWeb3Auth } from "@web3auth/modal/react";
import type { Web3AuthContextConfig } from "@web3auth/modal/react";
import { WEB3AUTH_NETWORK } from "@web3auth/modal";
import type { EIP1193Provider } from "viem";
import { web3AuthConnector, setWeb3AuthProvider } from "@/lib/web3AuthConnector";
import { IS_MINIPAY } from "@/lib/miniPayEthereum";

if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

// ── MiniPay: wipe wagmi localStorage before it initialises ───────────────────
// Prevents stale Privy/Web3Auth connector sessions from loading and overriding
// the MiniPay injected connector. Must run before createConfig.
if (typeof window !== "undefined" && (window.ethereum as any)?.isMiniPay) {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("wagmi"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

// ── Web3Auth config ───────────────────────────────────────────────────────────
const HIDDEN = { showOnModal: false } as const;

const web3AuthConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId:
      "BBsmG9D18eB6w5Mg3IXctRX2KTpNvao2o3slTS5A1q2Ce91XCckXz2Uc39H64zyiNXPUZ0ghHuUT6Ira1WPuqSE",
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    chains: [
      {
        chainNamespace: "eip155",
        chainId: "0xa4ec",
        rpcTarget: "https://celo-mainnet.g.alchemy.com/v2/YcblzW7m_-ItUCMj1Mu17",
        displayName: "Celo Mainnet",
        ticker: "CELO",
        tickerName: "Celo",
        blockExplorerUrl: "https://celoscan.io",
        logo: "https://cryptologos.cc/logos/celo-celo-logo.png",
      },
    ],
    defaultChainId: "0xa4ec",
    modalConfig: {
      connectors: {
        auth: {
          label: "auth",
          loginMethods: {
            google: HIDDEN, twitter: HIDDEN, facebook: HIDDEN, discord: HIDDEN,
            apple: HIDDEN, github: HIDDEN, reddit: HIDDEN, twitch: HIDDEN,
            linkedin: HIDDEN, line: HIDDEN, kakao: HIDDEN, wechat: HIDDEN,
            farcaster: HIDDEN,
          },
        },
      },
    },
  },
};

// ── Transport ─────────────────────────────────────────────────────────────────
// Slot 0: window.ethereum for MiniPay (throws for non-MiniPay → fallback continues).
// Slot 1+: HTTP RPCs for everyone else.
const celoTransport = fallback([
  wagmiCustom({
    async request({ method, params }: { method: string; params?: unknown[] }) {
      const eth = typeof window !== "undefined" ? (window.ethereum as any) : null;
      if (!eth?.isMiniPay) throw new Error("not-minipay");
      return eth.request({ method, params });
    },
  }),
  http("https://celo-mainnet.g.alchemy.com/v2/YcblzW7m_-ItUCMj1Mu17"),
  http("https://forno.celo.org"),
  http("https://rpc.ankr.com/celo"),
  http("https://1rpc.io/celo"),
]);

// ── Connectors & configs ──────────────────────────────────────────────────────
export const miniPayConnector = injected({
  target() {
    return {
      id: "injected",
      name: typeof window !== "undefined" && (window.ethereum as any)?.isMiniPay
        ? "MiniPay"
        : "MetaMask",
      provider: typeof window !== "undefined" ? (window.ethereum as any) : undefined,
    };
  },
});

// MiniPay config — HTTP-only transport for all read/receipt operations.
// Writes bypass wagmi entirely (walletClient.sendTransaction via nativeMiniPayEthereum),
// so the MiniPay WebView slot is not needed here and only adds latency to
// useWaitForTransactionReceipt polling and useReadContracts calls.
const miniPayHttpTransport = fallback([
  http("https://celo-mainnet.g.alchemy.com/v2/YcblzW7m_-ItUCMj1Mu17"),
  http("https://forno.celo.org"),
  http("https://rpc.ankr.com/celo"),
  http("https://1rpc.io/celo"),
]);

const miniPayWagmiConfig = createConfig({
  chains: [celo],
  connectors: [miniPayConnector],
  transports: { [celo.id]: miniPayHttpTransport },
});

// Full config — Privy WagmiProvider adds its own connector on top of these.
export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [miniPayConnector, web3AuthConnector],
  transports: { [celo.id]: celoTransport },
});

// ── Shared UI ─────────────────────────────────────────────────────────────────
const toastOptions = {
  duration: 4000,
  style: {
    background: "#111111", color: "#ffffff", border: "1px solid #262626",
    borderRadius: "999px", padding: "12px 20px", fontSize: "13px",
    fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", maxWidth: "420px",
  },
  success: { iconTheme: { primary: "#ffffff", secondary: "#111111" } },
  error:   { iconTheme: { primary: "#ef4444", secondary: "#111111" } },
};

const privyAppId = "cmmw8pr3l00lr0cjp282x5v3l";

// ── Providers ─────────────────────────────────────────────────────────────────
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false },
      },
    }),
  );

  // Detect MiniPay after mount to avoid SSR hydration mismatch.
  // Starts false (matches server). useEffect flips it to true if in MiniPay,
  // swapping to the lightweight StandardWagmiProvider before the user sees any UI.
  const [isMiniPay, setIsMiniPay] = React.useState(false);
  React.useEffect(() => {
    setIsMiniPay(IS_MINIPAY);
  }, []);

  const appTree = (
    <MiniPayProvider>
      <AudioProvider>
        <IdentityProvider>{children}</IdentityProvider>
      </AudioProvider>
    </MiniPayProvider>
  );

  // ── MiniPay branch ──────────────────────────────────────────────────────────
  // StandardWagmiProvider: plain wagmi with only miniPayConnector.
  // Privy's WagmiProvider is deliberately NOT used — it injects Privy's embedded
  // wallet connector and can auto-restore a Privy session from privy:* localStorage
  // keys, overriding the MiniPay injected connector even after our wagmi wipe.
  // PrivyProvider is still rendered so usePrivy() in useAuth doesn't throw.
  // Web3AuthProvider is still rendered so useWeb3Auth() in useAuth doesn't throw.
  if (isMiniPay) {
    return (
      <Web3AuthProvider config={web3AuthConfig}>
        <PrivyProvider appId={privyAppId} config={{
          defaultChain: celo, supportedChains: [celo],
          loginMethods: ["email", "wallet"],
          embeddedWallets: { ethereum: { createOnLogin: "off" } },
        }}>
          <QueryClientProvider client={queryClient}>
            <StandardWagmiProvider config={miniPayWagmiConfig}>
              <MiniPayConnector />
              {appTree}
              <Toaster position="top-center" toastOptions={toastOptions} />
            </StandardWagmiProvider>
          </QueryClientProvider>
        </PrivyProvider>
      </Web3AuthProvider>
    );
  }

  // ── Full branch (Privy / Web3Auth users) ────────────────────────────────────
  return (
    <Web3AuthProvider config={web3AuthConfig}>
      <PrivyProvider
        appId={privyAppId}
        config={{
          defaultChain: celo,
          supportedChains: [celo],
          appearance: {
            theme: "#000000", accentColor: "#ffffff",
            logo: "/focus-pet-logo.jpeg",
            landingHeader: "Sign in to FocusPet",
            loginMessage: "Raise a pet. Earn G$. Focus more.",
          },
          embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
          loginMethods: ["email", "wallet"],
        }}
      >
        <QueryClientProvider client={queryClient}>
          <PrivyWagmiProvider config={wagmiConfig}>
            <Web3AuthWagmiSync />
            {appTree}
            <Toaster position="top-center" toastOptions={toastOptions} />
          </PrivyWagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </Web3AuthProvider>
  );
}

// ── Web3AuthWagmiSync ─────────────────────────────────────────────────────────
// Only rendered in the full branch — never runs for MiniPay users.
function Web3AuthWagmiSync() {
  const { provider, isConnected: web3authIsConnected } = useWeb3Auth();
  const { connect, connectors } = useConnect();

  React.useEffect(() => {
    if (!web3authIsConnected || !provider) return;
    setWeb3AuthProvider(provider as EIP1193Provider);
    const connector = connectors.find((c) => c.id === "web3auth");
    if (connector) connect({ connector });
  }, [web3authIsConnected, provider, connect, connectors]);

  React.useEffect(() => {
    if (!web3authIsConnected) setWeb3AuthProvider(null);
  }, [web3authIsConnected]);

  React.useEffect(() => {
    if (!web3authIsConnected || !provider) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setWeb3AuthProvider(provider as EIP1193Provider);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [web3authIsConnected, provider]);

  return null;
}

// ── MiniPayConnector ──────────────────────────────────────────────────────────
// Only rendered in the MiniPay branch. Calls eth_requestAccounts via wagmi's
// connect() — authorises window.ethereum and populates useAccount() with the
// MiniPay address so useAuth() works.
// Retries up to 4 times (at 1s, 2s, 3s, 4s) in case MiniPay's provider is
// slow to inject or the first connect() call silently rejects.
function MiniPayConnector() {
  const { connect, error: connectError } = useConnect();
  const { connector } = useAccount();
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (connector?.id === "injected") return;
    if (attempt > 4) return;
    const delay = attempt === 0 ? 800 : attempt * 1000;
    const timer = setTimeout(() => {
      if (!(window.ethereum as any)?.isMiniPay) return;
      connect({ connector: miniPayConnector });
    }, delay);
    return () => clearTimeout(timer);
  }, [connector, connect, attempt]);

  React.useEffect(() => {
    if (connectError && attempt < 4) {
      setAttempt((a) => a + 1);
    }
  }, [connectError]);

  return null;
}
