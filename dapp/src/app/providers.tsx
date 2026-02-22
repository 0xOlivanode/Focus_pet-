"use client";

import * as React from "react";
import {
  RainbowKitProvider,
  getDefaultConfig,
  Locale,
} from "@rainbow-me/rainbowkit";
import { celo } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http, fallback } from "wagmi";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import "@rainbow-me/rainbowkit/styles.css";

import { AudioProvider } from "@/hooks/useAudio";

const config = getDefaultConfig({
  appName: "FocusPet",
  projectId: "a615d03b7ef9bf7b6a4117a0a9ec5845", // Replace with valid WalletConnect ID
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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RainbowKitProvider>
            <AudioProvider>{children}</AudioProvider>
            <Toaster richColors position="bottom-right" />
          </RainbowKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
