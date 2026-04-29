"use client";

import { useEffect, useState, useMemo } from "react";
import { usePublicClient } from "wagmi";
import { useIdentitySDK, IdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useUnifiedWalletClient } from "@/hooks/useUnifiedWalletClient";

export type IdentityStatus = "loading" | "verified" | "not_verified" | "error";

export function useIdentity() {
  const { address } = useAuth();
  const publicClient = usePublicClient();
  const walletClient = useUnifiedWalletClient();
  const identitySDKFromHook = useIdentitySDK("production");

  // If useIdentitySDK returns null (can happen for Web3Auth users before wagmi syncs),
  // build it manually the same way Delulu does — avoids the "identitySDK is null" bail-out.
  const identitySDK = useMemo(() => {
    if (identitySDKFromHook) return identitySDKFromHook;
    if (!publicClient || !walletClient) return null;
    return new (IdentitySDK as any)(publicClient, walletClient, "production");
  }, [identitySDKFromHook, publicClient, walletClient]);

  const [status, setStatus] = useState<IdentityStatus>("loading");
  const [fvLink, setFvLink] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const checkVerification = async () => {
    if (!address || !publicClient || !identitySDK || !walletClient?.account?.address) {
      setStatus("not_verified");
      return;
    }

    try {
      if (!isVerifying) setStatus("loading");

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

  useEffect(() => {
    checkVerification();
  }, [address, !!publicClient, !!identitySDK, !!walletClient?.account?.address]);

  // Generate link only once when verification process starts
  useEffect(() => {
    if (isVerifying && !fvLink && !isGeneratingLink) {
      generateLink();
    }
  }, [isVerifying, !!fvLink, isGeneratingLink, address, publicClient, walletClient, identitySDK]);

  // Poll identity status while verifying
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isVerifying && status !== "verified") {
      interval = setInterval(() => {
        checkVerification();
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isVerifying, status, address, publicClient, identitySDK]);

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
  };
}
