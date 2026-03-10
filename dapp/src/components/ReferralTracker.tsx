"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      // Store the referrer in localStorage if not already present,
      // or overwrite if you prefer latest click wins. We will overwrite here.
      localStorage.setItem("focuspet_referrer", ref);
      console.log("Referrer saved:", ref);
    }
  }, [searchParams]);

  return null;
}
