"use client";

// Stub — GoodDollar identity removed. Kept for import compatibility.
export type IdentityContextValue = {
  isVerified: boolean;
  isVerifying: boolean;
  setIsVerifying: (v: boolean) => void;
};

export function useIdentityContext(): IdentityContextValue {
  return { isVerified: false, isVerifying: false, setIsVerifying: () => {} };
}
