"use client";

import React, { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useIdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gift,
  Sparkles,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { formatEther } from "viem";

export function ClaimReward() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const identitySDK = useIdentitySDK("production");

  const [entitlement, setEntitlement] = useState<bigint>(BigInt(0));
  const [isLoading, setIsLoading] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [status, setStatus] = useState<
    "not_whitelisted" | "can_claim" | "already_claimed" | "loading"
  >("loading");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const checkEntitlement = async () => {
    if (
      !address ||
      !publicClient ||
      !walletClient ||
      !identitySDK ||
      !isMounted
    )
      return;

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
      setStatus(walletStatus.status);
    } catch (error) {
      console.error("Entitlement check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkEntitlement();
    // Refresh every 5 minutes
    const interval = setInterval(checkEntitlement, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [address, !!publicClient, !!walletClient, !!identitySDK]);

  const handleClaim = async () => {
    if (!address || !publicClient || !walletClient || !identitySDK) return;

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
      await checkEntitlement();
    } catch (error: any) {
      console.error("Claim failed:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!address) return null;

  return (
    <div className="w-full mt-6 overflow-hidden bg-linear-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-indigo-500/20 dark:via-purple-500/10 dark:to-transparent rounded-3xl border border-indigo-100 dark:border-indigo-900/50 p-6 relative group">
      {/* Background Sparkles */}
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
        <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse" />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
              <Gift size={20} />
            </div>
            <h3 className="font-black text-lg tracking-tight">
              Daily G$ Reward
            </h3>
          </div>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium max-w-xs leading-relaxed">
            As a verified human, you can claim free GoodDollar tokens every day.
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <div className="text-right">
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400 dark:text-neutral-500 block mb-1">
              Available to Claim
            </span>
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">
                {isLoading
                  ? "..."
                  : parseFloat(formatEther(entitlement)).toFixed(2)}
              </span>
              <span className="text-xs font-bold text-indigo-400 dark:text-indigo-600">
                G$
              </span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {status === "not_whitelisted" ? (
              <motion.button
                key="verify"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={handleClaim} // Claim triggers redirect for FV
                className="flex items-center gap-2 bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/10 border border-indigo-100 dark:border-indigo-900/50 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-all active:scale-95"
              >
                Face Verify Required
                <ExternalLink size={14} />
              </motion.button>
            ) : status === "already_claimed" ? (
              <motion.div
                key="claimed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 px-6 py-3 rounded-2xl font-bold text-sm border border-neutral-200 dark:border-neutral-700"
              >
                Claimed Today ✨
              </motion.div>
            ) : (
              <motion.button
                key="claim"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                disabled={entitlement === BigInt(0) || isClaiming}
                onClick={handleClaim}
                className="relative overflow-hidden group/btn flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-200 dark:disabled:bg-neutral-800 text-white disabled:text-neutral-400 px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-1 active:scale-95 group"
              >
                {isClaiming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Claim Now
                    <Sparkles
                      size={16}
                      className="group-hover/btn:rotate-12 transition-transform"
                    />
                  </>
                )}
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      {status === "not_whitelisted" && (
        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
          <AlertCircle size={14} />
          First time? You'll need to complete a quick face scan to ensure one
          human = one reward.
        </div>
      )}
    </div>
  );
}
