"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, fallback, http } from "wagmi";

import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { celo } from "wagmi/chains";

import { AudioProvider } from "@/hooks/useAudio";

const privyAppId = "cmmw8pr3l00lr0cjp282x5v3l";

export const wagmiConfig = createConfig({
  chains: [celo],
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
          logo: "https://focus-pet.xyz/favicon.ico",
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
            <GasStationTrigger />
            <AudioProvider>{children}</AudioProvider>
            <Toaster position="bottom-right" />
          </ThemeProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

function GasStationTrigger() {
  const { address, isConnected } = useAccount();

  React.useEffect(() => {
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
