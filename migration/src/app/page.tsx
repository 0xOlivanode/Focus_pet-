"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useWeb3Auth } from "@web3auth/modal/react";
import { ConnectStep } from "@/components/ConnectStep";
import { PreviewStep } from "@/components/PreviewStep";
import { ExecuteStep } from "@/components/ExecuteStep";
import { useState } from "react";
import { useWeb3AuthDisconnect } from "@web3auth/modal/react";

interface PetData {
  petName: string;
  username: string;
  xp: bigint;
  health: bigint;
  streak: bigint;
  hasPet: boolean;
}

interface MigrationParams {
  miniPayAddress: `0x${string}`;
  usdtBalance: bigint;
  gBalance: bigint;
  pet: PetData;
}

export default function Home() {
  const { ready: privyReady, authenticated, logout: privyLogout } = usePrivy();
  const { wallets } = useWallets();
  const { isConnected: web3authConnected, isInitialized: web3authReady, provider: web3authProvider } = useWeb3Auth();
  const { disconnect: web3authDisconnect } = useWeb3AuthDisconnect();

  const [migrationParams, setMigrationParams] = useState<MigrationParams | null>(null);

  // Derive address and provider from whichever auth is active
  const privyWallet = wallets[0];
  const isPrivy = authenticated && !!privyWallet;
  const isWeb3Auth = web3authConnected && !!web3authProvider;
  const isConnected = isPrivy || isWeb3Auth;

  const address: `0x${string}` | undefined = isPrivy
    ? privyWallet?.address as `0x${string}`
    : isWeb3Auth
      ? undefined // resolved async below
      : undefined;

  // We resolve Web3Auth address lazily inside PreviewStep/ExecuteStep via the provider
  const [web3authAddress, setWeb3authAddress] = useState<`0x${string}` | undefined>();

  // Resolve Web3Auth address once provider is available
  if (isWeb3Auth && !web3authAddress && web3authProvider) {
    (web3authProvider as any).request({ method: "eth_accounts" }).then((accounts: string[]) => {
      if (accounts?.[0]) setWeb3authAddress(accounts[0] as `0x${string}`);
    }).catch(() => {});
  }

  const resolvedAddress: `0x${string}` | undefined = isPrivy ? address : web3authAddress;

  async function getProvider(): Promise<any> {
    if (isPrivy && privyWallet) return privyWallet.getEthereumProvider();
    if (isWeb3Auth && web3authProvider) return web3authProvider;
    throw new Error("No wallet connected");
  }

  async function logout() {
    if (isPrivy) await privyLogout();
    else if (isWeb3Auth) await web3authDisconnect();
    setMigrationParams(null);
    setWeb3authAddress(undefined);
  }

  const isReady = privyReady && web3authReady;

  if (!isReady) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-xs">
        {!isConnected || !resolvedAddress ? (
          <ConnectStep />
        ) : migrationParams ? (
          <ExecuteStep
            address={resolvedAddress}
            miniPayAddress={migrationParams.miniPayAddress}
            usdtBalance={migrationParams.usdtBalance}
            gBalance={migrationParams.gBalance}
            pet={migrationParams.pet}
            getProvider={getProvider}
          />
        ) : (
          <PreviewStep
            address={resolvedAddress}
            onStart={(miniPayAddress, usdtBalance, gBalance, pet) =>
              setMigrationParams({ miniPayAddress, usdtBalance, gBalance, pet })
            }
          />
        )}

        {isConnected && (
          <button
            onClick={logout}
            className="mt-6 w-full text-neutral-500 text-xs hover:text-white transition-colors"
          >
            Disconnect
          </button>
        )}
      </div>

      <p className="fixed bottom-4 text-neutral-700 text-xs">
        FocusPet Migration · Available until 31 August 2026
      </p>
    </main>
  );
}
