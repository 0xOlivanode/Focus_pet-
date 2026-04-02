"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, useConnect, fallback, http } from "wagmi";
import { injected } from "wagmi/connectors";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { celo } from "wagmi/chains";

import { AudioProvider } from "@/hooks/useAudio";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";

// React Query uses JSON.stringify internally to hash query/mutation keys.
// Transaction receipts and contract args contain BigInt (blockNumber, gasUsed, etc.).
// @privy-io/wagmi's createConfig does NOT apply wagmi's BigInt-safe query key hasher,
// so we patch BigInt.prototype.toJSON — the approach recommended by both wagmi v2 and
// React Query docs for this exact scenario.
if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

const privyAppId = "cmmw8pr3l00lr0cjp282x5v3l";

export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [injected()],
  transports: {
    [celo.id]: fallback([
      http("https://rpc.ankr.com/celo"),
      http("https://forno.celo.org"),
      http("https://1rpc.io/celo"),
      http(), // Fallback to Wagmi default
    ]),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        defaultChain: celo,
        supportedChains: [celo],
        appearance: {
          theme: "light",
          accentColor: "#4f46e5",
          logo: "/focus-pet.png",
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
          <ThemeProvider attribute="class" defaultTheme="light">
            <MiniPayConnector />
            <GasStationTrigger />
            <AudioProvider>{children}</AudioProvider>
            <IOSInstallPrompt />
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

function MiniPayConnector() {
  const { connect } = useConnect();
  const { isConnected } = useAccount();

  React.useEffect(() => {
    if ((window.ethereum as any)?.isMiniPay && !isConnected) {
      connect({ connector: injected({ target: "metaMask" }) });
    }
  }, []);

  return null;
}

function GasStationTrigger() {
  const { address, isConnected } = useAccount();

  React.useEffect(() => {
    // MiniPay users pay gas in USDm — skip the CELO faucet
    if ((window.ethereum as any)?.isMiniPay) return;

    // Invisible Faucet: Automatically drop gas to new users
    if (isConnected && address) {
      fetch("/api/faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      })
        .then((res) => res.json())
        .then((data) => console.log("Invisible Faucet Response:", data))
        .catch((err) => {
          console.error("Invisible Gas Station failed:", err);
        });
    }
  }, [isConnected, address]);

  return null;
}
