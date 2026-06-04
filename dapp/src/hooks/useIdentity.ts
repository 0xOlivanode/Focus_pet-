"use client";

import { useEffect, useState, useMemo } from "react";
import { usePublicClient } from "wagmi";
import { useIdentitySDK, IdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useUnifiedWalletClient } from "@/hooks/useUnifiedWalletClient";

export type IdentityStatus = "loading" | "verified" | "not_verified" | "error";

const GRACE_PERIOD_MS = 5 * 60 * 1000; // 5 minutes of background polling after modal close

export function useIdentity() {
  const { address } = useAuth();
  const publicClient = usePublicClient();
  const walletClient = useUnifiedWalletClient();
  const identitySDKFromHook = useIdentitySDK("production");

  // If useIdentitySDK returns null (can happen for Web3Auth users before wagmi syncs),
  // build it manually — same pattern as Delulu — so identitySDK is never stuck null.
  const identitySDK = useMemo(() => {
    if (identitySDKFromHook) return identitySDKFromHook;
    if (!publicClient || !walletClient) return null;
    return new (IdentitySDK as any)(publicClient, walletClient, "production");
  }, [identitySDKFromHook, publicClient, walletClient]);

  const [status, setStatus] = useState<IdentityStatus>("loading");
  const [fvLink, setFvLink] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Timestamp when the user last opened the verification modal.
  // Polling continues for GRACE_PERIOD_MS after they close it, so a slow
  // GoodDollar blockchain confirmation doesn't leave them stuck.
  const [verificationAttemptedAt, setVerificationAttemptedAt] = useState<number | null>(null);

  const isPendingVerification =
    !isVerifying &&
    verificationAttemptedAt !== null &&
    status !== "verified";

  const checkVerification = async () => {
    if (!address || !publicClient || !identitySDK || !walletClient?.account?.address) {
      // Defer to avoid setState during wagmi's Hydrate render cycle (React dev warning).
      // Stay in "loading" until we actually have the deps to perform a real check.
      return;
    }

    try {
      // Don't flash "loading" during background polling.
      // queueMicrotask defers the setState out of any active render cycle
      // (e.g. React Query's Hydrate), silencing the dev-mode cross-component warning.
      if (!isVerifying && !isPendingVerification) queueMicrotask(() => setStatus("loading"));

      const claimSDK = new ClaimSDK({
        account: address,
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        identitySDK: identitySDK as any,
        env: "production",
      });

      const walletStatus = await claimSDK.getWalletClaimStatus();

      if (walletStatus.status === "not_whitelisted") {
        setStatus("not_verified");
      } else {
        setStatus("verified");
        setIsVerifying(false);
        setVerificationAttemptedAt(null);
      }
    } catch (error: any) {
      const msg: string = error?.message ?? String(error);
      // GoodDollar SDK internally queries both Celo and Fuse chains.
      // Fuse RPC failures are transient network errors, not a real identity failure.
      if (
        msg.includes("fuse-rpc") ||
        msg.includes("pokt.network") ||
        msg.includes("ERR_NAME_NOT_RESOLVED") ||
        msg.includes("network")
      ) {
        return;
      }
      console.error("Identity check failed:", error);
      setStatus("error");
    }
  };

  const generateLink = async () => {
    if (!address || !publicClient || !walletClient || !identitySDK || isGeneratingLink) return;

    try {
      setIsGeneratingLink(true);

      const idSDK = new (IdentitySDK as any)(
        publicClient,
        walletClient,
        "production",
      );

      // Use pathname only — avoids appending isVerified=true to existing query params
      const callbackUrl = window.location.origin + window.location.pathname;

      const linkResult = await idSDK.generateFVLink(
        false,
        callbackUrl,
        42220,
      );

      let finalLink = "";
      if (typeof linkResult === "string") {
        finalLink = linkResult;
      } else if (linkResult && (linkResult as any).link) {
        finalLink = (linkResult as any).link;
      }

      if (finalLink) {
        setFvLink(finalLink);
        setStatus("not_verified");
      } else {
        setStatus("error");
      }
    } catch (e: any) {
      console.error("❌ Failed to generate FV link:", e);
      setStatus("error");
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Initial check + re-check when key deps change
  useEffect(() => {
    checkVerification();
  }, [address, !!publicClient, !!identitySDK, !!walletClient?.account?.address]);

  // Record when user opens the modal
  useEffect(() => {
    if (isVerifying) {
      setVerificationAttemptedAt(Date.now());
    }
  }, [isVerifying]);

  // Generate FV link once when modal opens
  useEffect(() => {
    if (isVerifying && !fvLink && !isGeneratingLink) {
      generateLink();
    }
  }, [isVerifying, !!fvLink, isGeneratingLink, address, publicClient, walletClient, identitySDK]);

  // Polling: runs while modal is open OR during grace period after close.
  // The interval checks the grace period on each tick so it self-terminates
  // after GRACE_PERIOD_MS even if React deps don't change.
  useEffect(() => {
    if (status === "verified") return;

    const attemptedAt = verificationAttemptedAt; // capture at effect-run time
    const withinGracePeriodNow =
      attemptedAt !== null && Date.now() - attemptedAt < GRACE_PERIOD_MS;

    if (!isVerifying && !withinGracePeriodNow) return;

    const interval = setInterval(() => {
      // Self-terminate once grace period expires (prevents indefinite polling)
      if (!isVerifying && attemptedAt !== null) {
        if (Date.now() - attemptedAt >= GRACE_PERIOD_MS) {
          clearInterval(interval);
          return;
        }
      }
      checkVerification();
    }, 5000);

    return () => clearInterval(interval);
  }, [isVerifying, verificationAttemptedAt, status, address, !!publicClient, !!identitySDK, !!walletClient?.account?.address]);

  // Track successful referral once verified
  useEffect(() => {
    if (status === "verified" && address) {
      const referrer = localStorage.getItem("focuspet_referrer");
      if (referrer && referrer.toLowerCase() !== address.toLowerCase()) {
        const recordReferral = async () => {
          try {
            const { error } = await supabase
              .from("referrals")
              .upsert(
                { referrer, referred: address },
                { onConflict: "referrer,referred", ignoreDuplicates: true },
              );

            if (!error || error.code === "23505") {
              localStorage.removeItem("focuspet_referrer");
            } else {
              console.error("❌ Failed to track referral:", error.message);
            }
          } catch (e) {
            console.error("Referral tracking error:", e);
          }
        };
        recordReferral();
      }
    }
  }, [status, address]);

  return {
    status,
    isVerified: status === "verified",
    fvLink,
    refresh: checkVerification,
    generateLink,
    isLoading: status === "loading",
    isVerifying,
    setIsVerifying,
    isGeneratingLink,
    isPendingVerification,
  };
}
