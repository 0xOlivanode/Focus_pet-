"use client";

import React, { useEffect, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { useIdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, AlertCircle, ShieldCheck } from "lucide-react";
import { formatEther } from "viem";
import { useIdentity } from "@/hooks/useIdentity";
import { IdentityModal } from "./IdentityModal";

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

  // Use the global identity hook for verification state
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
  }, []);

  const checkEntitlement = async () => {
    if (!address || !publicClient || !identitySDK || !isMounted) {
      console.log("⏭️ Claim check skipped: Missing", {
        address: !!address,
        publicClient: !!publicClient,
        identitySDK: !!identitySDK,
        isMounted,
      });
      return;
    }

    try {
      setIsLoading(true);
      const claimSDK = new ClaimSDK({
        account: address,
        publicClient: publicClient as any,
        walletClient: (walletClient as any) || undefined,
        identitySDK: identitySDK as any,
        env: "production",
      });

      console.log("⏳ Checking G$ entitlement for:", address);
      const walletStatus = await claimSDK.getWalletClaimStatus();
      console.log("✅ G$ Status fetched:", walletStatus);
      setEntitlement(walletStatus.entitlement);
      setStatus(walletStatus.status as any);
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
  }, [address, !!publicClient, !!identitySDK, isMounted]);

  const handleClaim = async () => {
    if (!address || !publicClient || !walletClient || !identitySDK) return;

    if (status === "not_whitelisted") {
      setIsVerifying(true);
      return;
    }

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

      // Launch Confetti Celebration!
      const confetti = (await import("canvas-confetti")).default;
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#6366f1", "#a855f7", "#ec4899", "#f59e0b"],
      });

      await checkEntitlement();
    } catch (error: any) {
      console.error("Claim failed:", error);
    } finally {
      setIsClaiming(false);
    }
  };

  if (!isMounted || !address) return null;

  const FD = "var(--font-syne), var(--font-geist-sans)";
  const amount = isLoading ? "—" : parseFloat(formatEther(entitlement)).toFixed(2);

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 20,
        border: "1px solid #E8E0D5",
        padding: "18px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Green left accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          width: 4,
          background: "linear-gradient(to bottom, #2E7A4F, #4CAF72)",
          borderRadius: "20px 0 0 20px",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {/* Left: label + amount */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 44, height: 44, borderRadius: 14,
              background: "#EAF5EF",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Gift size={20} color="#2E7A4F" />
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#7A7067", marginBottom: 2 }}>
              Daily G$ Reward
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
              <span style={{ fontFamily: FD, fontWeight: 800, fontSize: 22, color: "#2E7A4F", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {amount}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#7A9E8A" }}>G$</span>
              <span style={{ fontSize: 11, color: "#B0A89E", marginLeft: 2 }}>available</span>
            </div>
          </div>
        </div>

        {/* Right: action */}
        <AnimatePresence mode="wait">
          {status === "not_whitelisted" ? (
            <motion.button
              key="verify"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setIsVerifying(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 18px", borderRadius: 12,
                background: "#EAF5EF", border: "1px solid #C3E0CE",
                color: "#2E7A4F", fontSize: 13, fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <ShieldCheck size={15} />
              Verify to Claim
            </motion.button>
          ) : status === "already_claimed" ? (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 18px", borderRadius: 12,
                background: "#F0EBE3", border: "1px solid #E8E0D5",
                color: "#7A7067", fontSize: 13, fontWeight: 700,
              }}
            >
              Claimed today ✓
            </motion.div>
          ) : (
            <motion.button
              key="claim"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              disabled={entitlement === BigInt(0) || isClaiming}
              onClick={handleClaim}
              whileHover={!isClaiming ? { scale: 1.03 } : {}}
              whileTap={!isClaiming ? { scale: 0.97 } : {}}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 20px", borderRadius: 12,
                background: entitlement === BigInt(0) || isClaiming ? "#E8E0D5" : "#2E7A4F",
                border: "none",
                color: entitlement === BigInt(0) || isClaiming ? "#B0A89E" : "#fff",
                fontSize: 13, fontWeight: 700,
                cursor: entitlement === BigInt(0) || isClaiming ? "not-allowed" : "pointer",
                boxShadow: entitlement > BigInt(0) && !isClaiming ? "0 4px 14px rgba(46,122,79,0.3)" : "none",
                transition: "all 0.2s",
              }}
            >
              {isClaiming ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }}
                />
              ) : (
                <Gift size={15} />
              )}
              {isClaiming ? "Claiming…" : "Claim G$"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {status === "not_whitelisted" && (
        <div
          style={{
            marginTop: 12,
            display: "flex", alignItems: "center", gap: 8,
            padding: "8px 12px", borderRadius: 10,
            background: "#FFFBEB", border: "1px solid #FDE68A",
            fontSize: 11, fontWeight: 600, color: "#92400E",
          }}
        >
          <AlertCircle size={13} color="#D97706" />
          You'll need to complete a quick face scan — one human, one reward.
        </div>
      )}

      <IdentityModal
        isOpen={isVerifying}
        onClose={() => setIsVerifying(false)}
        fvLink={fvLink}
        status={isVerified ? "verified" : (identityStatus as any)}
        onRefresh={() => {
          refreshIdentity();
          if (!fvLink) generateIdentityLink();
        }}
      />
    </div>
  );
}
