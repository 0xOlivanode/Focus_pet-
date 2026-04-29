"use client";

import { useEffect, useState, useMemo, useRef } from "react";
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

  // Tracks the timestamp when the user last opened the verification modal.
  // Polling continues for GRACE_PERIOD_MS after they close it, so a slow
  // GoodDollar blockchain confirmation doesn't leave them stuck.
  const [verificationAttemptedAt, setVerificationAttemptedAt] = useState<number | null>(null);

  // Whether background polling is running after the modal was closed
  const isPendingVerification =
    !isVerifying &&
    verificationAttemptedAt !== null &&
    status !== "verified";

  const checkVerification = async () => {
    if (!address || !publicClient || !identitySDK || !walletClient?.account?.address) {
      setStatus("not_verified");
      return;
    }

    try {
      // Don't flash "loading" while background polling — only show it on foreground checks
      if (!isVerifying && !isPendingVerification) setStatus("loading");

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
        setVerificationAttemptedAt(null); // clear grace period — we're done
      }
    } catch (error) {
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

      const linkResult = await idSDK.generateFVLink(
        false,
        window.location.href,
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
      }
    } catch (e: any) {
      console.error("❌ Failed to generate FV link:", e);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  // Initial check
  useEffect(() => {
    checkVerification();
  }, [address, !!publicClient, !!identitySDK, !!walletClient?.account?.address]);

  // Record when user opens the modal so we can keep polling after they close it
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
  // This means a slow GoodDollar confirmation (~10-60s) is still detected
  // even after the user closes the modal thinking they're done.
  useEffect(() => {
    if (status === "verified") return;

    const withinGracePeriod =
      verificationAttemptedAt !== null &&
      Date.now() - verificationAttemptedAt < GRACE_PERIOD_MS;

    if (!isVerifying && !withinGracePeriod) return;

    const interval = setInterval(() => {
      checkVerification();
    }, 5000);

    return () => clearInterval(interval);
  }, [isVerifying, verificationAttemptedAt, status, address, publicClient, identitySDK]);

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
    isPendingVerification, // true while background-polling after modal close
  };
}
