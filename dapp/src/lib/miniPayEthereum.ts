// Captures the native MiniPay ethereum provider at module-load time — before
// Privy or Web3Auth can replace window.ethereum with their own injected provider.
// Importing this module anywhere in the app is safe on SSR (window is guarded).
export const nativeMiniPayEthereum: Parameters<typeof import("viem").custom>[0] | null =
  typeof window !== "undefined" && (window.ethereum as any)?.isMiniPay === true
    ? (window.ethereum as any)
    : null;

export const IS_MINIPAY = nativeMiniPayEthereum !== null;
