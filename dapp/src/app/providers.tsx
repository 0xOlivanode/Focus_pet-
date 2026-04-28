"use client";

import * as React from "react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, useConnect, useConnectors, fallback, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { celo } from "wagmi/chains";
import { AudioProvider } from "@/hooks/useAudio";

// Web3Auth
import { Web3Auth } from "@web3auth/modal";
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base";
import { Web3AuthConnector } from "@web3auth/web3auth-wagmi-connector";

if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

// ── Web3Auth setup ────────────────────────────────────────────────────────────

const celoChainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xa4ec", // 42220
  rpcTarget: "https://forno.celo.org",
  displayName: "Celo",
  blockExplorerUrl: "https://celoscan.io",
  ticker: "CELO",
  tickerName: "Celo",
  decimals: 18,
};

const privateKeyProvider =
  typeof window !== "undefined"
    ? new EthereumPrivateKeyProvider({ config: { chainConfig: celoChainConfig } })
    : (null as unknown as InstanceType<typeof EthereumPrivateKeyProvider>);

export const web3authInstance =
  typeof window !== "undefined"
    ? new Web3Auth({
        clientId: process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID ?? "",
        web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
        chainConfig: celoChainConfig,
        privateKeyProvider,
        uiConfig: {
          appName: "FocusPet",
          mode: "dark",
          loginMethodsOrder: ["email_passwordless"],
          defaultLanguage: "en",
        },
      })
    : (null as unknown as InstanceType<typeof Web3Auth>);

// ── Wagmi config ──────────────────────────────────────────────────────────────

const privyAppId = "cmmw8pr3l00lr0cjp282x5v3l";

export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [
    injected(),                                    // MiniPay + MetaMask
    Web3AuthConnector({ web3AuthInstance: web3authInstance }),        // new users
  ],
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
  );
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
    // injected() is always connectors[0]
    const injectedConnector = connectors.find((c) => c.id === "injected");
    if (injectedConnector) connect({ connector: injectedConnector });
  }, [connectors, connect, isConnected]);

  return null;
}
