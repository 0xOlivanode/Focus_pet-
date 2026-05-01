"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEngagementRewards } from "@goodsdks/engagement-sdk";
import { useIdentityContext } from "@/contexts/IdentityContext";
import { fetchUserHistory } from "@/lib/subgraph";
import {
  ENGAGEMENT_REWARDS_CONTRACT,
  ENGAGEMENT_APP_ADDRESS,
  ENGAGEMENT_MIN_DAYS,
} from "@/config/contracts";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

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

  // Use the shared identity context — prevents a second useIdentity() instance
  // that would have its own separate verification state out of sync with the rest of the app.
  const { isVerified, isLoading: identityLoading, setIsVerifying } = useIdentityContext();

  const sdk = useEngagementRewards(ENGAGEMENT_REWARDS_CONTRACT);

  const [state, setState] = useState<EngagementRewardState>("loading");
  const [sessionDaysCount, setSessionDaysCount] = useState(0);
  const [rewardAmount, setRewardAmount] = useState<bigint>(0n);
  const [error, setError] = useState<string | null>(null);
  const checkedRef = useRef(false);
  const prevAddressRef = useRef(address);

  // ── Invite link ──────────────────────────────────────────────────────────
  const inviteLink =
    address && typeof window !== "undefined"
      ? `${window.location.origin}/app?invite=${btoa(JSON.stringify({ inviter: address }))}`
      : "";

  // Fetch the authoritative inviter from the server — never from localStorage.
  // This prevents client-side manipulation and works cross-device.
  const fetchInviter = async (): Promise<`0x${string}`> => {
    if (!address) return ZERO_ADDRESS;
    try {
      const res = await fetch(`/api/referrals?address=${address}`);
      if (!res.ok) return ZERO_ADDRESS;
      const { inviter } = await res.json();
      return (inviter as `0x${string}`) || ZERO_ADDRESS;
    } catch {
      return ZERO_ADDRESS;
    }
  };

  // ── Eligibility check ────────────────────────────────────────────────────
  const checkEligibility = useCallback(async () => {
    if (!address || !sdk) return;

    // Wait for the identity check to finish before evaluating — prevents
    // flicker where isVerified is briefly false while useIdentity is loading.
    if (identityLoading) return;

    // Feature guard — if app address isn't configured, hide the banner silently.
    if (!ENGAGEMENT_APP_ADDRESS) {
      setState("unavailable");
      return;
    }

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

      // 3. Fetch reward amount for display (non-critical)
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
  }, [address, sdk, isVerified, identityLoading]);

  // Reset on wallet change so a new address always gets a fresh check.
  useEffect(() => {
    if (prevAddressRef.current !== address) {
      prevAddressRef.current = address;
      checkedRef.current = false;
    }
    if (!checkedRef.current) {
      checkEligibility();
    }
  }, [checkEligibility]);

  // Re-check immediately when identity verification confirms
  useEffect(() => {
    if (checkedRef.current) {
      checkedRef.current = false;
      checkEligibility();
    }
  }, [isVerified]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Claim ────────────────────────────────────────────────────────────────
  // Auth approach: the userSignature from sdk.signClaim (EIP-712 over the claim
  // parameters) IS the proof of wallet ownership. The backend reconstructs the
  // same typed data and verifies it with verifyTypedData — no Privy token needed.
  // This works identically for Privy, Web3Auth, and MiniPay users.
  const claim = useCallback(async () => {
    if (!address || !sdk || state !== "eligible") return;

    setState("claiming");
    setError(null);

    try {
      // Fetch authoritative inviter from DB — server-determined, tamper-proof.
      // The same inviter the server will use when verifying the signature.
      const inviter = await fetchInviter();
      const currentBlock = await sdk.getCurrentBlockNumber();
      const validUntilBlock = currentBlock + 600n; // ~50 minutes on Celo

      const userSignature = await sdk.signClaim(
        ENGAGEMENT_APP_ADDRESS,
        inviter,
        validUntilBlock,
      );

      // Backend re-reads inviter from DB, verifies userSignature, co-signs.
      // No inviter in body — client cannot override what the server determined.
      const res = await fetch("/api/sign-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: address,
          validUntilBlock: validUntilBlock.toString(),
          userSignature,
        }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        throw new Error(msg || "Backend signing failed");
      }

      // Backend returns the inviter it used — use it for the on-chain call
      // to guarantee the inviter matches both signatures.
      const { signature: appSignature, inviter: authorizedInviter } = await res.json();

      await sdk.nonContractAppClaim(
        ENGAGEMENT_APP_ADDRESS,
        (authorizedInviter as `0x${string}`) || inviter,
        validUntilBlock,
        userSignature,
        appSignature,
      );

      setState("claimed");
    } catch (e: any) {
      console.error("Engagement reward claim failed:", e);
      if (e?.code === 4001 || e?.message?.includes("rejected")) {
        setState("eligible");
      } else {
        setState("error");
        setError(e?.message || "Claim failed");
      }
    }
  }, [address, sdk, state]);

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
