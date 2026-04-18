"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function ReferralTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    // ── FocusPet referral (?ref=address) ─────────────────────────────────
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("focuspet_referrer", ref);
    }

    // ── GoodDollar engagement reward inviter (?invite=base64Json) ─────────
    // Format: btoa(JSON.stringify({ inviter: "0x..." }))
    const invite = searchParams.get("invite");
    if (invite) {
      try {
        const { inviter } = JSON.parse(atob(invite));
        if (inviter && typeof inviter === "string" && inviter.startsWith("0x")) {
          localStorage.setItem("focuspet_gd_inviter", inviter);
        }
      } catch {
        // Malformed invite code — ignore silently
      }
    }
  }, [searchParams]);

  return null;
}
