"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePrivy } from "@privy-io/react-auth";
import { useEngagementRewards } from "@goodsdks/engagement-sdk";
import { useIdentity } from "./useIdentity";
import { fetchUserHistory } from "@/lib/subgraph";
import {
  ENGAGEMENT_REWARDS_CONTRACT,
  ENGAGEMENT_APP_ADDRESS,
  ENGAGEMENT_MIN_DAYS,
} from "@/config/contracts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;
const GD_INVITER_KEY = "focuspet_gd_inviter";

export type EngagementRewardState =
  | "loading"
  | "not_verified"    // needs GoodDollar face verification
  | "needs_sessions"  // hasn't focused on MIN_DAYS distinct days yet
  | "eligible"        // all checks pass — ready to claim
  | "claiming"        // tx in flight
  | "claimed"         // successfully claimed this period
  | "unavailable"     // already claimed / not eligible (4th app, etc.)
  | "error";

export function useEngagementReward() {
  const { address } = useAuth();
  const { getAccessToken } = usePrivy();
  const { isVerified, setIsVerifying } = useIdentity();
  const sdk = useEngagementRewards(ENGAGEMENT_REWARDS_CONTRACT);

  const [state, setState] = useState<EngagementRewardState>("loading");
  const [sessionDaysCount, setSessionDaysCount] = useState(0);
  const [rewardAmount, setRewardAmount] = useState<bigint>(0n);
  const [error, setError] = useState<string | null>(null);
  const checkedRef = useRef(false);

  // ── Invite link (GoodDollar pattern: ?invite=base64({inviter:address})) ──
  const inviteLink =
    address && typeof window !== "undefined"
      ? `${window.location.origin}/app?invite=${btoa(JSON.stringify({ inviter: address }))}`
      : "";

  const getInviter = (): `0x${string}` => {
    if (typeof window === "undefined") return ZERO_ADDRESS;
    const stored = localStorage.getItem(GD_INVITER_KEY);
    return (stored as `0x${string}`) || ZERO_ADDRESS;
  };

  // ── Eligibility check ────────────────────────────────────────────────────
  const checkEligibility = useCallback(async () => {
    if (!address || !sdk || !ENGAGEMENT_APP_ADDRESS) return;

    setState("loading");
    setError(null);
    checkedRef.current = true;

    try {
      // 1. Face verification (cheapest check first)
      if (!isVerified) {
        setState("not_verified");
        return;
      }

      // 2. Session days via subgraph
      const history = await fetchUserHistory(address, 30);
      const days = history?.dailyActivities?.length ?? 0;
      setSessionDaysCount(days);

      if (days < ENGAGEMENT_MIN_DAYS) {
        setState("needs_sessions");
        return;
      }

      // 3. Fetch reward amount for display
      try {
        const amount = await sdk.getRewardAmount();
        setRewardAmount(amount);
      } catch {
        // Non-critical — display will fall back to empty
      }

      // 4. Can claim? (checks whitelisting + cooldown + app eligibility)
      const eligible = await sdk.canClaim(ENGAGEMENT_APP_ADDRESS, address).catch(() => false);
      if (!eligible) {
        setState("unavailable");
        return;
      }

      setState("eligible");
    } catch (e: any) {
      console.error("Engagement reward eligibility check failed:", e);
      setState("error");
      setError(e?.message || "Could not check eligibility");
    }
  }, [address, sdk, isVerified]);

  useEffect(() => {
    if (!checkedRef.current) {
      checkEligibility();
    }
  }, [checkEligibility]);

  // Re-check when identity status changes
  useEffect(() => {
    if (checkedRef.current) {
      checkedRef.current = false;
      checkEligibility();
    }
  }, [isVerified]);

  // ── Claim ────────────────────────────────────────────────────────────────
  const claim = useCallback(async () => {
    if (!address || !sdk || state !== "eligible") return;

    setState("claiming");
    setError(null);

    try {
      const inviter = getInviter();
      const currentBlock = await sdk.getCurrentBlockNumber();
      const validUntilBlock = currentBlock + 600n; // ~50 minutes on Celo

      // User signature (wallet prompt — signs once every 180 days)
      const userSignature = await sdk.signClaim(
        ENGAGEMENT_APP_ADDRESS,
        inviter,
        validUntilBlock,
      );

      // App signature from backend
      const token = await getAccessToken();
      const res = await fetch("/api/sign-reward", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user: address,
          validUntilBlock: validUntilBlock.toString(),
          inviter,
        }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || "Backend signing failed");
      }

      const { signature: appSignature } = await res.json();

      // Submit on-chain
      await sdk.nonContractAppClaim(
        ENGAGEMENT_APP_ADDRESS,
        inviter,
        validUntilBlock,
        userSignature,
        appSignature,
      );

      // Clear stored inviter — reward is claimed
      localStorage.removeItem(GD_INVITER_KEY);
      setState("claimed");
    } catch (e: any) {
      console.error("Engagement reward claim failed:", e);
      // User rejected wallet prompt
      if (e?.code === 4001 || e?.message?.includes("rejected")) {
        setState("eligible"); // Let them try again
      } else {
        setState("error");
        setError(e?.message || "Claim failed");
      }
    }
  }, [address, sdk, state, getAccessToken]);

  return {
    state,
    sessionDaysCount,
    minDays: ENGAGEMENT_MIN_DAYS,
    rewardAmount,
    inviteLink,
    claim,
    error,
    refresh: () => {
      checkedRef.current = false;
      checkEligibility();
    },
    openVerification: () => setIsVerifying(true),
  };
}
