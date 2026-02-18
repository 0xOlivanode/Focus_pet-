"use client";

import * as React from "react";
import {
  RainbowKitProvider,
  getDefaultConfig,
  Locale,
} from "@rainbow-me/rainbowkit";
import { celo, celoSepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http } from "wagmi";
import { ThemeProvider } from "next-themes";
import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "FocusPet",
  projectId: "a615d03b7ef9bf7b6a4117a0a9ec5845", // Replace with valid WalletConnect ID
  chains: [celoSepolia],
  transports: {
    [celoSepolia.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
