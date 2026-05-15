"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const MiniPayContext = createContext<boolean | null>(null);

export function MiniPayProvider({ children }: { children: ReactNode }) {
  const [isMiniPay, setIsMiniPay] = useState<boolean | null>(null);

  useEffect(() => {
    if ((window.ethereum as any)?.isMiniPay) {
      setIsMiniPay(true);
      return;
    }

    // MiniPay injects window.ethereum asynchronously. Poll until detected.
    // Never short-circuit on window.ethereum existing without isMiniPay —
    // MiniPay can set the provider object before it sets the isMiniPay flag.
    let resolved = false;
    const interval = setInterval(() => {
      if ((window.ethereum as any)?.isMiniPay) {
        setIsMiniPay(true);
        resolved = true;
        clearInterval(interval);
      }
    }, 50);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!resolved) setIsMiniPay(false);
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <MiniPayContext.Provider value={isMiniPay}>
      {children}
    </MiniPayContext.Provider>
  );
}

export function useMiniPayContext(): boolean | null {
  return useContext(MiniPayContext);
}
