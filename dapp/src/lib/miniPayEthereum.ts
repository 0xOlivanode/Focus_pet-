// Captures the native MiniPay ethereum provider at module-load time — before
// Privy or Web3Auth can replace window.ethereum with their own injected provider.
// Importing this module anywhere in the app is safe on SSR (window is guarded).
export const nativeMiniPayEthereum: Parameters<typeof import("viem").custom>[0] | null =
  typeof window !== "undefined" && (window.ethereum as any)?.isMiniPay === true
    ? (window.ethereum as any)
    : null;

export const IS_MINIPAY = nativeMiniPayEthereum !== null;

// Freeze window.ethereum so that Privy and Web3Auth cannot overwrite it after
// their providers mount. MiniPay's native bridge delivers every RPC response by
// calling window.ethereum.sendResult(id, result). If any library replaces
// window.ethereum with a provider that lacks sendResult, every RPC call hangs.
// A no-op setter prevents all assignment attempts; the getter always returns the
// real MiniPay provider, so sendResult is always reachable.
if (typeof window !== "undefined" && nativeMiniPayEthereum !== null) {
  try {
    Object.defineProperty(window, "ethereum", {
      get: () => nativeMiniPayEthereum,
      set: () => {},         // silently ignore Privy/Web3Auth replacement attempts
      configurable: true,    // keep configurable so devtools can inspect
      enumerable: true,
    });
  } catch {
    // defineProperty can throw if the property was already made non-configurable
    // by another script. Swallow silently — nativeMiniPayEthereum still valid.
  }
}
