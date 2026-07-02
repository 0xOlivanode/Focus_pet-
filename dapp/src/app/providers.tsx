"use client";

import * as React from "react";
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  WagmiProvider,
  useConnect,
  useAccount,
  http,
  createConfig,
  fallback,
} from "wagmi";
import { injected } from "wagmi/connectors";
import { celo } from "wagmi/chains";
import { AudioProvider } from "@/hooks/useAudio";
import { MiniPayProvider } from "@/contexts/MiniPayContext";

if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
}

// ── MiniPay: wipe wagmi localStorage before it initialises ───────────────────
// Prevents stale Privy/Web3Auth connector sessions from loading and overriding
// the MiniPay injected connector. Must run before createConfig.
if (typeof window !== "undefined" && (window.ethereum as any)?.isMiniPay) {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith("wagmi"))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

export const miniPayConnector = injected({
  target() {
    return {
      id: "injected",
      name: "MiniPay",
      provider: typeof window !== "undefined" ? (window.ethereum as any) : undefined,
    };
  },
});

const transport = fallback([
  http(process.env.NEXT_PUBLIC_ALCHEMY_RPC_URL!),
  http("https://forno.celo.org"),
  http("https://rpc.ankr.com/celo"),
]);

export const wagmiConfig = createConfig({
  chains: [celo],
  connectors: [miniPayConnector],
  transports: { [celo.id]: transport },
});

const toastOptions = {
  duration: 4000,
  style: {
    background: "#111111", color: "#ffffff", border: "1px solid #262626",
    borderRadius: "999px", padding: "12px 20px", fontSize: "13px",
    fontWeight: 500, boxShadow: "0 8px 32px rgba(0,0,0,0.6)", maxWidth: "420px",
  },
  success: { iconTheme: { primary: "#ffffff", secondary: "#111111" } },
  error:   { iconTheme: { primary: "#ef4444", secondary: "#111111" } },
};

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () => new QueryClient({
      defaultOptions: {
        queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: false },
      },
    }),
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <MiniPayProvider>
          <AudioProvider>
            {children}
          </AudioProvider>
        </MiniPayProvider>
        <Toaster position="top-center" toastOptions={toastOptions} />
        <MiniPayConnector />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// ── MiniPayConnector ──────────────────────────────────────────────────────────
// Calls eth_requestAccounts via wagmi's
// connect() — authorises window.ethereum and populates useAccount() with the
// MiniPay address so useAuth() works.
// Retries up to 4 times (at 1s, 2s, 3s, 4s) in case MiniPay's provider is
// slow to inject or the first connect() call silently rejects.
function MiniPayConnector() {
  const { connect, error: connectError } = useConnect();
  const { connector } = useAccount();
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    if (connector?.id === "injected") return;
    if (attempt > 4) return;
    const delay = attempt === 0 ? 800 : attempt * 1000;
    const timer = setTimeout(() => {
      if (!(window.ethereum as any)?.isMiniPay) return;
      connect({ connector: miniPayConnector });
    }, delay);
    return () => clearTimeout(timer);
  }, [connector, connect, attempt]);

  React.useEffect(() => {
    if (connectError && attempt < 4) {
      setAttempt((a) => a + 1);
    }
  }, [connectError]);

  return null;
}
