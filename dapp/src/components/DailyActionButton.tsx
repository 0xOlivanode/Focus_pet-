"use client";

import { useState, useEffect, useMemo } from "react";
import { usePublicClient } from "wagmi";
import { formatEther } from "viem";
import { useIdentitySDK, IdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";
import { useIdentityContext } from "@/contexts/IdentityContext";
import { useAuth } from "@/hooks/useAuth";
import { useUnifiedWalletClient } from "@/hooks/useUnifiedWalletClient";
import { IdentityModal } from "./IdentityModal";
import {
  Loader2,
  Gift,
  GiftIcon,
  CircleAlert,
} from "lucide-react";
import toast from "react-hot-toast";

type ClaimStatus =
  | "loading"
  | "not_whitelisted"
  | "can_claim"
  | "already_claimed";

export function DailyActionButton() {
  const { address } = useAuth();
  const publicClient = usePublicClient();
  const walletClient = useUnifiedWalletClient();
  const identitySDKFromHook = useIdentitySDK("production");

  const identitySDK = useMemo(() => {
    if (identitySDKFromHook) return identitySDKFromHook;
    if (!publicClient || !walletClient) return null;
    return new (IdentitySDK as any)(publicClient, walletClient, "production");
  }, [identitySDKFromHook, publicClient, walletClient]);

  const [status, setStatus] = useState<ClaimStatus>("loading");
  const [entitlement, setEntitlement] = useState<bigint>(BigInt(0));
  const [isClaiming, setIsClaiming] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const {
    isVerified,
    fvLink,
    status: identityStatus,
    refresh: refreshIdentity,
    generateLink,
    isVerifying,
    setIsVerifying,
    isPendingVerification,
  } = useIdentityContext();

  useEffect(() => {
    setIsMounted(true);
    const t = setTimeout(
      () => setStatus((s) => (s === "loading" ? "not_whitelisted" : s)),
      4000,
    );
    return () => clearTimeout(t);
  }, []);

  const check = async () => {
    if (!address || !publicClient || !identitySDK || !walletClient?.account?.address || !isMounted) return;
    try {
      const sdk = new ClaimSDK({
        account: address,
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        identitySDK: identitySDK as any,
        env: "production",
      });
      const result = await sdk.getWalletClaimStatus();
      setEntitlement(result.entitlement);
      setStatus(result.status as ClaimStatus);
    } catch (err: any) {
      const msg: string = err?.message ?? String(err);
      if (
        msg.includes("fuse-rpc") ||
        msg.includes("pokt.network") ||
        msg.includes("ERR_NAME_NOT_RESOLVED") ||
        msg.includes("network")
      ) {
        return;
      }
      setStatus("not_whitelisted");
    }
  };

  useEffect(() => {
    check();
    const t = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [address, !!publicClient, !!identitySDK, !!walletClient?.account?.address, isMounted]);

  // Re-check claim status the moment identity verification is confirmed.
  // Without this, the button stays on "Verify account" until the 5-minute interval fires.
  useEffect(() => {
    if (isVerified && isMounted) {
      check();
    }
  }, [isVerified]);

  const handleClaim = async () => {
    if (!address || !publicClient || !walletClient || !identitySDK) return;
    try {
      setIsClaiming(true);
      const sdk = new ClaimSDK({
        account: address,
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        identitySDK: identitySDK as any,
        env: "production",
      });
      await sdk.claim();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#01FF8B", "#6366f1", "#f59e0b"],
      });
      toast.success("Daily G$ reward claimed!");
      await check();
    } catch (err: any) {
      const msg: string = err?.message ?? err?.reason ?? "";
      if (
        msg.toLowerCase().includes("rejected") ||
        msg.toLowerCase().includes("denied") ||
        msg.toLowerCase().includes("cancelled") ||
        msg.toLowerCase().includes("user rejected")
      ) {
        toast.error("Claim cancelled.");
      } else {
        toast.error("Claim failed. Please try again.");
      }
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isMounted || !address) return null;

  if (status === "loading") {
    return (
      <div className="bg-[#0F0F0F] rounded-full p-1 flex items-center opacity-60 pointer-events-none">
        <div className="rounded-full py-3 px-6 bg-[#01FF8B] text-[#070707] flex items-center gap-x-2 text-xs lg:text-sm font-medium">
          <Loader2 size={14} className="animate-spin" />
          Checking...
        </div>
      </div>
    );
  }

  if (status === "not_whitelisted") {
    // User has scanned but GoodDollar's tx hasn't confirmed yet — show "Processing..."
    // so they know something is happening and don't scan again unnecessarily.
    if (isPendingVerification) {
      return (
        <>
          <div className="bg-[#0F0F0F] rounded-full p-1 flex items-center gap-x-2">
            <div className="rounded-full py-3 px-6 bg-[#FFCC01]/20 text-[#FFCC01] flex items-center gap-x-2 text-xs lg:text-sm font-medium border border-[#FFCC01]/30">
              <Loader2 size={14} className="animate-spin" />
              Processing verification…
            </div>
            <button
              onClick={() => setIsVerifying(true)}
              className="py-3 px-4 text-[#BBBBBB] text-xs hover:text-white transition-colors"
            >
              Open
            </button>
          </div>
          <IdentityModal
            isOpen={isVerifying}
            onClose={() => setIsVerifying(false)}
            fvLink={fvLink}
            status={isVerified ? "verified" : (identityStatus as any)}
            onRefresh={() => {
              refreshIdentity();
              if (!fvLink) generateLink();
            }}
          />
        </>
      );
    }

    return (
      <>
        <div className="bg-[#0F0F0F] rounded-full p-1 flex items-center">
          <button
            onClick={() => setIsVerifying(true)}
            className="rounded-full py-3 px-6 bg-[#FFCC01] text-[#070707] flex items-center gap-x-1"
          >
            <CircleAlert />
            Verify account
          </button>
          <div className="py-2 px-6">
            <h5 className="max-w-[120px] text-[#BBBBBB] text-[13px]">
              One-time face scan required
            </h5>
          </div>
        </div>
        <IdentityModal
          isOpen={isVerifying}
          onClose={() => setIsVerifying(false)}
          fvLink={fvLink}
          status={isVerified ? "verified" : (identityStatus as any)}
          onRefresh={() => {
            refreshIdentity();
            if (!fvLink) generateLink();
          }}
        />
      </>
    );
  }

  if (status === "already_claimed") {
    return (
      <div className="bg-[#0F0F0F] p-1 rounded-full">
        <div className="rounded-full flex items-center gap-x-2 bg-[#01FF8B1A] shrink-0 py-3 px-3 lg:px-6 text-[#01FF8B] text-xs lg:text-sm">
          <GiftIcon className="w-5 h-5" /> Reward Claimed!
        </div>
      </div>
    );
  }

  // can_claim
  const amount = parseFloat(formatEther(entitlement)).toFixed(2);
  return (
    <div className="bg-[#0F0F0F] rounded-full p-1 flex items-center">
      <button
        onClick={handleClaim}
        disabled={isClaiming || entitlement === BigInt(0)}
        className="flex items-center gap-2 bg-[#01FF8B] text-[#070707] py-3 px-6 rounded-full text-xs lg:text-sm font-medium whitespace-nowrap transition-all hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isClaiming ? <Loader2 size={14} className="animate-spin" /> : null}
        <Gift size={16} />
        Claim Daily Reward
      </button>
      <div className="py-[15px] px-6 text-xs/[100%] lg:text-sm/[100%] text-white">
        {amount} G$
      </div>
    </div>
  );
}
