"use client";

import * as React from "react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useConnect,
  useConnectors,
  useDisconnect,
  fallback,
  http,
  createConfig,
  custom as wagmiCustom,
} from "wagmi";
// useAccount / useConnectors / useDisconnect are used by MiniPayConnector below
import { injected } from "wagmi/connectors";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "@privy-io/wagmi";
import { celo } from "wagmi/chains";
import { AudioProvider } from "@/hooks/useAudio";
import { IdentityProvider } from "@/contexts/IdentityContext";
import { MiniPayProvider } from "@/contexts/MiniPayContext";
import { Web3AuthProvider, useWeb3Auth } from "@web3auth/modal/react";
import type { Web3AuthContextConfig } from "@web3auth/modal/react";
import { WEB3AUTH_NETWORK } from "@web3auth/modal";
import type { EIP1193Provider } from "viem";
import {
  web3AuthConnector,
  setWeb3AuthProvider,
} from "@/lib/web3AuthConnector";

if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

// ── Web3Auth v10 config ───────────────────────────────────────────────────────

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
        rpcTarget:
          "https://celo-mainnet.g.alchemy.com/v2/YcblzW7m_-ItUCMj1Mu17",
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
            google: HIDDEN,
            twitter: HIDDEN,
            facebook: HIDDEN,
            discord: HIDDEN,
            apple: HIDDEN,
            github: HIDDEN,
            reddit: HIDDEN,
            twitch: HIDDEN,
            linkedin: HIDDEN,
            line: HIDDEN,
            kakao: HIDDEN,
            wechat: HIDDEN,
            farcaster: HIDDEN,
          },
        },
      },
    },
  },
};

// ── Wagmi config ─────────────────────────────────────────────────────────────
// @privy-io/wagmi adds Privy's embedded-wallet connector automatically.
// injected() covers MiniPay + MetaMask.
// web3AuthConnector bridges Web3Auth into wagmi via the module-level provider store.

let alch_key = "https://celo-mainnet.g.alchemy.com/v2/YcblzW7m_-ItUCMj1Mu17";

// ── Celo transport ───────────────────────────────────────────────────────────
// Slot 0 (MiniPay only): routes ALL RPC calls through window.ethereum.
//   MiniPay's sandbox blocks HTTP eth_estimateGas and eth_sendTransaction, so
//   every call must go through the injected provider. Throws immediately for
//   non-MiniPay environments so the fallback skips straight to slot 1.
// Slot 1+ (everyone else): standard HTTP RPCs.
const celoTransport = fallback([
  wagmiCustom({
    async request({ method, params }: { method: string; params?: unknown[] }) {
      const eth = typeof window !== "undefined" ? (window.ethereum as any) : null;
      if (!eth?.isMiniPay) throw new Error("not-minipay");
      return eth.request({ method, params });
    },
  }),
  ...(alch_key ? [http("https://celo-mainnet.g.alchemy.com/v2/YcblzW7m_-ItUCMj1Mu17")] : []),
  http("https://forno.celo.org"),
  http("https://rpc.ankr.com/celo"),
  http("https://1rpc.io/celo"),
]);

export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [injected(), web3AuthConnector],
  transports: {
    [celo.id]: celoTransport,
  },
});

// ── Providers ─────────────────────────────────────────────────────────────────

const privyAppId = "cmmw8pr3l00lr0cjp282x5v3l";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <Web3AuthProvider config={web3AuthConfig}>
      <PrivyProvider
        appId={privyAppId}
        config={{
          defaultChain: celo,
          supportedChains: [celo],
          appearance: {
            theme: "#000000",
            accentColor: "#ffffff",
            logo: "/focus-pet-logo.jpeg",
            landingHeader: "Sign in to FocusPet",
            loginMessage: "Raise a pet. Earn G$. Focus more.",
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          loginMethods: ["email", "wallet"],
        }}
      >
        <QueryClientProvider client={queryClient}>
          <WagmiProvider config={wagmiConfig}>
            <>
              <MiniPayConnector />
              <Web3AuthWagmiSync />
              <MiniPayProvider>
                <AudioProvider>
                  <IdentityProvider>{children}</IdentityProvider>
                </AudioProvider>
              </MiniPayProvider>
              <Toaster
                position="top-center"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: "#111111",
                    color: "#ffffff",
                    border: "1px solid #262626",
                    borderRadius: "999px",
                    padding: "12px 20px",
                    fontSize: "13px",
                    fontWeight: 500,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
                    maxWidth: "420px",
                  },
                  success: {
                    iconTheme: { primary: "#ffffff", secondary: "#111111" },
                  },
                  error: {
                    iconTheme: { primary: "#ef4444", secondary: "#111111" },
                  },
                }}
              />
            </>
          </WagmiProvider>
        </QueryClientProvider>
      </PrivyProvider>
    </Web3AuthProvider>
  );
}

// Bridges Web3Auth's EIP1193 provider into wagmi so all wagmi hooks work for Web3Auth users.
// Pattern mirrors the Delulu reference implementation exactly:
//   - use connect() (fire-and-forget), NOT connectAsync() — async throws on failure and
//     its catch block can corrupt state, leaving the user stuck on the loading screen
//   - get connectors from useConnect(), not a separate useConnectors() call
//   - no syncedRef needed; wagmi's connect() is idempotent when already connected
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

  // Re-sync the provider every time the tab regains visibility.
  // On mobile, locking the screen or switching apps suspends the browser tab.
  // Web3Auth's internal signing transport dies during suspension — the _provider
  // reference in the module-level store stays alive but the underlying connection
  // is dead. Without this, any transaction fired immediately after the user returns
  // (e.g. a long focus timer completing) uses a dead provider and fails silently.
  React.useEffect(() => {
    if (!web3authIsConnected || !provider) return;
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        setWeb3AuthProvider(provider as EIP1193Provider);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [web3authIsConnected, provider]);

  return null;
}

function MiniPayConnector() {
  const connectors = useConnectors();
  const { connect } = useConnect();
  const hasAttempted = React.useRef(false);

  React.useEffect(() => {
    if (hasAttempted.current || connectors.length === 0) return;
    // Always connect the injected connector when in MiniPay, regardless of
    // whether wagmi thinks it's already connected (stale sessions from a
    // previous Web3Auth/Privy login would otherwise block this).
    if (!(window.ethereum as any)?.isMiniPay) return;
    hasAttempted.current = true;
    const injectedConnector = connectors.find((c) => c.id === "injected");
    if (injectedConnector) connect({ connector: injectedConnector });
  }, [connectors, connect]);

  return null;
}
