"use client";

import { useMiniPayContext } from "@/contexts/MiniPayContext";

// Single source of truth — reads from MiniPayProvider in the root Providers tree.
// The provider detects once on app load and never re-runs on client-side navigation.
export function useIsMiniPay(): boolean | null {
  return useMiniPayContext();
}

/** Opens MiniPay's native QR scanner and resolves with the scanned address/data.
 *  Returns null if not in MiniPay or user cancels. */
export async function miniPayScanQrCode(): Promise<string | null> {
  if (typeof window === "undefined" || !(window.ethereum as any)?.isMiniPay) {
    return null;
  }
  try {
    const result = await (window.ethereum as any).request({
      method: "minipay_scanQrCode",
      params: [],
    });
    return result ?? null;
  } catch {
    return null;
  }
}

/** Fetches a live exchange rate between two currency codes via MiniPay.
 *  e.g. getExchangeRate("USDT", "NGN") → 1240.5
 *  Returns null if not in MiniPay or rate unavailable. */
export async function miniPayGetExchangeRate(
  from: string,
  to: string,
): Promise<number | null> {
  if (typeof window === "undefined" || !(window.ethereum as any)?.isMiniPay) {
    return null;
  }
  try {
    const rate = await (window.ethereum as any).request({
      method: "minipay_getExchangeRate",
      params: [from, to],
    });
    return typeof rate === "number" ? rate : null;
  } catch {
    return null;
  }
}
