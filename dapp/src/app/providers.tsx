"use client";

import * as React from "react";
import {
  RainbowKitProvider,
  getDefaultConfig,
  Locale,
} from "@rainbow-me/rainbowkit";
import { celo, celoAlfajores } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const config = getDefaultConfig({
  appName: "FocusPet",
  projectId: "YOUR_PROJECT_ID", // Replace with valid WalletConnect ID
  chains: [celoAlfajores],
  ssr: true,
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
