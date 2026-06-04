"use client";

import "./globals.css";
import { PrivyProvider } from "@privy-io/react-auth";
import { Web3AuthProvider } from "@web3auth/modal/react";
import type { Web3AuthContextConfig } from "@web3auth/modal/react";
import { WEB3AUTH_NETWORK } from "@web3auth/modal";
import { celo } from "viem/chains";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "cmmw8pr3l00lr0cjp282x5v3l";

const web3AuthConfig: Web3AuthContextConfig = {
  web3AuthOptions: {
    clientId: "BBsmG9D18eB6w5Mg3IXctRX2KTpNvao2o3slTS5A1q2Ce91XCckXz2Uc39H64zyiNXPUZ0ghHuUT6Ira1WPuqSE",
    web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_MAINNET,
    chains: [
      {
        chainNamespace: "eip155",
        chainId: "0xa4ec",
        rpcTarget: "https://celo-mainnet.g.alchemy.com/v2/YcblzW7m_-ItUCMj1Mu17",
        displayName: "Celo Mainnet",
        ticker: "CELO",
        tickerName: "Celo",
        blockExplorerUrl: "https://celoscan.io",
        logo: "https://cryptologos.cc/logos/celo-celo-logo.png",
      },
    ],
    defaultChainId: "0xa4ec",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Web3AuthProvider config={web3AuthConfig}>
          <PrivyProvider
            appId={PRIVY_APP_ID}
            config={{
              defaultChain: celo,
              supportedChains: [celo],
              appearance: { theme: "dark" },
              loginMethods: ["email", "wallet"],
              embeddedWallets: { ethereum: { createOnLogin: "users-without-wallets" } },
            }}
          >
            {children}
          </PrivyProvider>
        </Web3AuthProvider>
      </body>
    </html>
  );
}
