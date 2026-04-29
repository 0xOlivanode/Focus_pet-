"use client";

import React, { createContext, useContext } from "react";
import { useIdentity } from "@/hooks/useIdentity";

type IdentityContextValue = ReturnType<typeof useIdentity>;

const IdentityContext = createContext<IdentityContextValue | null>(null);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const identity = useIdentity();
  return (
    <IdentityContext.Provider value={identity}>
      {children}
    </IdentityContext.Provider>
  );
}

export function useIdentityContext(): IdentityContextValue {
  const ctx = useContext(IdentityContext);
  if (!ctx) throw new Error("useIdentityContext must be used inside IdentityProvider");
  return ctx;
}
