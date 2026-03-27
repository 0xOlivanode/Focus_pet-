"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import toast, { Toaster } from "react-hot-toast";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAccount, useSignMessage, fallback, http } from "wagmi";

import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth";
import { SmartWalletsProvider } from "@privy-io/react-auth/smart-wallets";
import { WagmiProvider, createConfig } from "@privy-io/wagmi";
import { celo } from "wagmi/chains";

import { AudioProvider } from "@/hooks/useAudio";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";

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
          <SmartWalletsProvider>
            <ThemeProvider attribute="class" defaultTheme="light">
              <GasStationTrigger />
              <AudioProvider>{children}</AudioProvider>
              <IOSInstallPrompt />
              <Toaster position="bottom-right" />
            </ThemeProvider>
          </SmartWalletsProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyProvider>
  );
}

function GasStationTrigger() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { ready } = usePrivy();
  const { wallets } = useWallets();
  // Track which addresses we've already attempted so re-renders / wallets
  // reference changes don't trigger duplicate requests.
  const attemptedRef = React.useRef<Set<string>>(new Set());

  React.useEffect(() => {
    if (!isConnected || !address || !ready || wallets.length === 0) return;

    // Embedded wallets (email/social login) have gas sponsored via the Privy
    // smart wallet paymaster — they never need the faucet.
    // Only fund external wallets (MetaMask, hardware wallets, WalletConnect).
    const connectedWallet = wallets.find(
      (w) => w.address.toLowerCase() === address.toLowerCase()
    );
    const isEmbedded = connectedWallet?.walletClientType === "privy";
    if (isEmbedded) return;

    // Already attempted for this address in this session — don't re-prompt.
    if (attemptedRef.current.has(address.toLowerCase())) return;
    attemptedRef.current.add(address.toLowerCase());

    const requestGas = async () => {
      const toastId = "gas-station";
      try {
        toast.loading("Sign to top up your gas wallet...", { id: toastId });

        const timestamp = Math.floor(Date.now() / 1000);
        const message = `FocusPet gas request\nAddress: ${address}\nTime: ${timestamp}`;
        const signature = await signMessageAsync({ message });

        toast.loading("Checking gas balance...", { id: toastId });

        const res = await fetch("/api/faucet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address, signature, timestamp }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.code === "COOLDOWN_ACTIVE") {
            toast.dismiss(toastId);
          } else if (data.code === "IP_RATE_LIMITED") {
            toast.error("Too many gas requests from your network. Try again later.", { id: toastId });
          } else {
            toast.error(data.error ?? "Gas top-up failed. Please try again.", { id: toastId });
          }
          return;
        }

        if (data.funded) {
          toast.success("Gas topped up! 0.005 CELO sent to your wallet.", { id: toastId });
        } else {
          toast.dismiss(toastId);
        }
      } catch (err: any) {
        // User rejected the signature — dismiss silently
        if (err?.message?.includes("rejected") || err?.code === 4001) {
          toast.dismiss(toastId);
        } else {
          toast.error("Gas top-up failed. Please try again.", { id: toastId });
        }
        console.error("Gas station failed:", err);
      }
    };

    requestGas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isConnected, address, ready, wallets.length]);

  return null;
}
