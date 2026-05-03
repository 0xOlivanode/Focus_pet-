"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { isAddress } from "viem";
import { useAuth } from "@/hooks/useAuth";

const GD_INVITER_KEY = "focuspet_gd_inviter";
const REF_KEY = "focuspet_referrer";

export function ReferralTracker() {
  const searchParams = useSearchParams();
  const { address } = useAuth();
  const persistedRef = useRef(false);

  // ── Capture from URL → localStorage buffer ───────────────────────────────
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) localStorage.setItem("focuspet_referrer", ref);

    const invite = searchParams.get("invite");
    if (invite) {
      try {
        const { inviter } = JSON.parse(atob(invite));
        if (inviter && isAddress(inviter)) {
          localStorage.setItem(GD_INVITER_KEY, inviter);
        }
      } catch {
        // Malformed invite code — ignore
      }
    }
  }, [searchParams]);

  // ── Persist to DB as soon as wallet address is available ─────────────────
  // localStorage is a short-lived buffer only. Once the DB write succeeds,
  // localStorage is cleared — future claims read from the server.
  useEffect(() => {
    if (!address || persistedRef.current) return;

    // Prefer ?ref= link (InviteButton) over ?invite= (GoodDollar flow)
    const inviter =
      localStorage.getItem(REF_KEY) || localStorage.getItem(GD_INVITER_KEY);
    if (!inviter || !isAddress(inviter)) return;
    if (inviter.toLowerCase() === address.toLowerCase()) return; // no self-referral

    persistedRef.current = true;

    fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitee: address, inviter }),
    })
      .then((res) => {
        if (res.ok) {
          localStorage.removeItem(REF_KEY);
          localStorage.removeItem(GD_INVITER_KEY);
        } else {
          persistedRef.current = false;
        }
      })
      .catch(() => {
        // Network failure — leave localStorage intact so next mount retries
        persistedRef.current = false;
      });
  }, [address]);

  return null;
}
