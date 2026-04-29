"use client";

import * as React from "react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  useAccount,
  useConnect,
  useConnectors,
  useDisconnect,
  fallback,
  http,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { celo } from "wagmi/chains";
import { AudioProvider } from "@/hooks/useAudio";
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
    uiConfig: {
      appName: "FocusPet",
      mode: "dark",
      // popup keeps auth inside the modal; redirect causes a full page reload
      // which drops Web3Auth session state and lands the user back on the email form
      uxMode: "popup",
      logoDark: "/focus-pet-logo.svg",
      logoLight: "/focus-pet-logo.svg",
      theme: {
        primary: "#ffffff",
        onPrimary: "#000000",
      },
    },
    chains: [
      {
        chainNamespace: "eip155",
        chainId: "0xa4ec",
        rpcTarget: "https://forno.celo.org",
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

export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [injected(), web3AuthConnector],
  transports: {
    [celo.id]: fallback([
      http("https://rpc.ankr.com/celo"),
      http("https://forno.celo.org"),
      http("https://1rpc.io/celo"),
      http(),
    ]),
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
              <AudioProvider>{children}</AudioProvider>
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

// Bridges Web3Auth's EIP1193 provider into wagmi so all wagmi hooks work for Web3Auth users
function Web3AuthWagmiSync() {
  const { provider, status } = useWeb3Auth();
  const { connectAsync } = useConnect();
  const { disconnect } = useDisconnect();
  const { isConnected } = useAccount();
  const syncedRef = React.useRef(false);

  React.useEffect(() => {
    if (status !== "connected" || !provider || isConnected || syncedRef.current)
      return;
    syncedRef.current = true;

    setWeb3AuthProvider(provider as EIP1193Provider);
    // @privy-io/wagmi narrows connectAsync's types to its own connectors; cast to bypass
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (connectAsync as any)({ connector: web3AuthConnector }).catch(() => {
      syncedRef.current = false;
      setWeb3AuthProvider(null);
    });
  }, [status, provider, isConnected]);

  React.useEffect(() => {
    if (status === "disconnected") {
      if (syncedRef.current && isConnected) disconnect();
      setWeb3AuthProvider(null);
      syncedRef.current = false;
    }
  }, [status]);

  return null;
}

function MiniPayConnector() {
  const connectors = useConnectors();
  const { connect } = useConnect();
  const { isConnected } = useAccount();
  const hasAttempted = React.useRef(false);

  React.useEffect(() => {
    if (hasAttempted.current || connectors.length === 0) return;
    if (!(window.ethereum as any)?.isMiniPay || isConnected) return;
    hasAttempted.current = true;
    const injectedConnector = connectors.find((c) => c.id === "injected");
    if (injectedConnector) connect({ connector: injectedConnector });
  }, [connectors, connect, isConnected]);

  return null;
}
