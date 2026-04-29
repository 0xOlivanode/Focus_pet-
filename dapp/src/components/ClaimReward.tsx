"use client";

import React, { useEffect, useState, useMemo } from "react";
import { usePublicClient } from "wagmi";
import { formatEther } from "viem";
import { useIdentitySDK, IdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, ArrowRight, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useIdentity } from "@/hooks/useIdentity";
import { useAuth } from "@/hooks/useAuth";
import { useUnifiedWalletClient } from "@/hooks/useUnifiedWalletClient";
import { IdentityModal } from "./IdentityModal";

export function ClaimReward() {
  const { address } = useAuth();
  const publicClient = usePublicClient();
  const walletClient = useUnifiedWalletClient();
  const identitySDKFromHook = useIdentitySDK("production");

  // Fallback: build IdentitySDK manually if the hook returns null (Web3Auth users
  // before wagmi syncs). Mirrors delulu's pattern to ensure identitySDK is never
  // stuck as null when the user is actually connected.
  const identitySDK = useMemo(() => {
    if (identitySDKFromHook) return identitySDKFromHook;
    if (!publicClient || !walletClient) return null;
    return new (IdentitySDK as any)(publicClient, walletClient, "production");
  }, [identitySDKFromHook, publicClient, walletClient]);

  const [entitlement, setEntitlement] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [status, setStatus] = useState<
    "not_whitelisted" | "can_claim" | "already_claimed" | "loading"
  >("loading");
  const [isMounted, setIsMounted] = useState(false);

  const {
    isVerified,
    fvLink,
    status: identityStatus,
    refresh: refreshIdentity,
    generateLink: generateIdentityLink,
    isVerifying,
    setIsVerifying,
  } = useIdentity();

  useEffect(() => {
    setIsMounted(true);
    // Safety net: surface verify button after 4s if identitySDK never initializes
    const t = setTimeout(
      () => setStatus((s) => (s === "loading" ? "not_whitelisted" : s)),
      4000,
    );
    return () => clearTimeout(t);
  }, []);

  const checkEntitlement = async () => {
    if (!address || !publicClient || !identitySDK || !walletClient?.account?.address || !isMounted) return;
    try {
      setIsLoading(true);
      const claimSDK = new ClaimSDK({
        account: address,
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        identitySDK: identitySDK as any,
        env: "production",
      });
      const walletStatus = await claimSDK.getWalletClaimStatus();
      setEntitlement(walletStatus.entitlement);
      setStatus(walletStatus.status as any);
    } catch (error) {
      console.error("Entitlement check failed:", error);
      setStatus("not_whitelisted");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkEntitlement();
    const interval = setInterval(checkEntitlement, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [address, !!publicClient, !!identitySDK, !!walletClient?.account?.address, isMounted]);

  const handleClaim = async () => {
    if (!address || !publicClient || !walletClient || !identitySDK) return;
    if (status === "not_whitelisted") { setIsVerifying(true); return; }
    try {
      setIsClaiming(true);
      const claimSDK = new ClaimSDK({
        account: address,
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        identitySDK: identitySDK as any,
        env: "production",
      });
      await claimSDK.claim();
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ["#6366f1", "#a855f7", "#ec4899", "#f59e0b"] });
      await checkEntitlement();
    } catch (error) {
      console.error("Claim failed:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isMounted || !address) return null;

  const amountDisplay = isLoading || status === "loading"
    ? "—"
    : parseFloat(formatEther(entitlement)).toFixed(2);

  return (
    <>
      <div className="w-full mt-6 rounded-3xl overflow-hidden relative">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-linear-to-br from-indigo-600 to-violet-700 opacity-100" />
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        />
        {/* Glow orb */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Left: label + amount */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Gift size={15} className="text-white" />
              </div>
              <span className="text-white/80 font-black text-xs uppercase tracking-widest">
                Daily G$ Reward
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-black text-white tracking-tighter leading-none">
                {amountDisplay}
              </span>
              <span className="text-white/60 font-bold text-base">G$</span>
            </div>

            <p className="text-white/50 text-[11px] font-medium mt-1.5 leading-relaxed">
              Claim free GoodDollar as a verified human — every day.
            </p>
          </div>

          {/* Right: CTA */}
          <div className="flex flex-col items-stretch sm:items-end gap-2 sm:min-w-[160px]">
            <AnimatePresence mode="wait">
              {status === "loading" ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 bg-white/15 text-white px-5 py-3 rounded-2xl font-bold text-sm border border-white/20 backdrop-blur-sm"
                >
                  <Loader2 size={15} className="animate-spin" />
                  Checking…
                </motion.div>
              ) : status === "not_whitelisted" ? (
                <motion.button
                  key="verify"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setIsVerifying(true)}
                  className="flex items-center justify-center gap-2 bg-white text-indigo-700 px-5 py-3 rounded-2xl font-black text-sm hover:bg-indigo-50 transition-all active:scale-95 shadow-lg shadow-black/20"
                >
                  <ShieldCheck size={15} />
                  Face Verify
                </motion.button>
              ) : status === "already_claimed" ? (
                <motion.div
                  key="claimed"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-center gap-2 bg-white/15 text-white px-5 py-3 rounded-2xl font-bold text-sm border border-white/20 backdrop-blur-sm"
                >
                  <CheckCircle2 size={15} className="text-emerald-300" />
                  Claimed Today
                </motion.div>
              ) : (
                <motion.button
                  key="claim"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  disabled={entitlement === BigInt(0) || isClaiming || isLoading}
                  onClick={handleClaim}
                  className="relative overflow-hidden flex items-center justify-center gap-2 bg-white text-indigo-700 px-5 py-3 rounded-2xl font-black text-sm shadow-lg shadow-black/20 hover:bg-indigo-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 group/btn"
                >
                  {isClaiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      Claim Now
                      <ArrowRight size={15} className="group-hover/btn:translate-x-0.5 transition-transform" />
                    </>
                  )}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-indigo-100/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                </motion.button>
              )}
            </AnimatePresence>

            {status === "not_whitelisted" && (
              <p className="text-white/40 text-[10px] font-medium text-center sm:text-right leading-tight px-1">
                One-time face scan required
              </p>
            )}
          </div>
        </div>
      </div>

      <IdentityModal
        isOpen={isVerifying}
        onClose={() => setIsVerifying(false)}
        fvLink={fvLink}
        status={isVerified ? "verified" : (identityStatus as any)}
        onRefresh={() => { refreshIdentity(); if (!fvLink) generateIdentityLink(); }}
      />
    </>
  );
}
