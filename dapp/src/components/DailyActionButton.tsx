"use client";

import { useState, useEffect } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useIdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";
import { useIdentity } from "@/hooks/useIdentity";
import { IdentityModal } from "./IdentityModal";
import { formatEther } from "viem";
import {
  Loader2,
  CheckCircle2,
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
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const identitySDK = useIdentitySDK("production");

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
  } = useIdentity();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const check = async () => {
    if (!address || !publicClient || !identitySDK || !isMounted) return;
    try {
      const sdk = new ClaimSDK({
        account: address,
        publicClient: publicClient as any,
        walletClient: (walletClient as any) || undefined,
        identitySDK: identitySDK as any,
        env: "production",
      });
      const result = await sdk.getWalletClaimStatus();
      setEntitlement(result.entitlement);
      setStatus(result.status as ClaimStatus);
    } catch {
      // silently fail — button stays hidden
    }
  };

  useEffect(() => {
    check();
    const t = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [address, !!publicClient, !!identitySDK, isMounted]);

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

  if (!isMounted || !address || status === "loading") return null;

  if (status === "not_whitelisted") {
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
