"use client";

import * as React from "react";
import {
  RainbowKitProvider,
  connectorsForWallets,
} from "@rainbow-me/rainbowkit";
import {
  walletConnectWallet,
  metaMaskWallet,
  coinbaseWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { celo } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http, fallback, createConfig } from "wagmi";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@rainbow-me/rainbowkit/styles.css";

import { AudioProvider } from "@/hooks/useAudio";

const projectId = "a615d03b7ef9bf7b6a4117a0a9ec5845";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [
        walletConnectWallet,
        metaMaskWallet,
        coinbaseWallet,
        rainbowWallet,
      ],
    },
  ],
  {
    appName: "FocusPet",
    projectId,
  },
);

const config = createConfig({
  connectors,
  chains: [celo],
  transports: {
    [celo.id]: fallback([
      http(), // Default Celo RPC
      http("https://rpc.ankr.com/celo"), // Backup Ankr RPC
    ]),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <RainbowKitProvider>
            <AudioProvider>{children}</AudioProvider>
            <Toaster richColors position="bottom-right" />
          </RainbowKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
