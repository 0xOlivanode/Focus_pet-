"use client";
import { FocusTimer } from "@/components/FocusTimer";
import { PetView } from "@/components/PetView";
import { ImpactDashboard } from "@/components/ImpactDashboard";
import {
  PetStage,
  PetMood,
  getPetStage,
  getNextStageInfo,
  getStageName,
} from "@/utils/pet";
import { Leaderboard } from "@/components/Leaderboard";
import { useState, useEffect } from "react";
import { useFocusPet } from "@/hooks/useFocusPet";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { PetShop } from "@/components/PetShop";
import { useIdentity } from "@/hooks/useIdentity";

import { useAccount } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import { formatEther } from "viem";
import { PrivyConnectButton } from "@/components/PrivyConnectButton";
import { OnboardingModal } from "@/components/OnboardingModal";
import dynamic from "next/dynamic";
const ClaimReward = dynamic(
  () => import("@/components/ClaimReward").then((mod) => mod.ClaimReward),
  {
    ssr: false,
  },
);
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Gift,
  AlertCircle,
  Loader2,
  ExternalLink,
  HelpCircle,
  User,
  Edit2,
  X,
  Share2,
  Menu,
} from "lucide-react";
import toast, { Toast } from "react-hot-toast";
import { useAudio } from "@/hooks/useAudio";
import { SoundMenu } from "@/components/SoundMenu";
import { StreakFlame } from "./../../components/StreakFlame";
import { NamingModal } from "@/components/NamingModal";
import { useStreaming } from "@/hooks/useStreaming";
import { Navbar } from "@/components/Navbar";

import { Suspense } from "react";

const TIMERS = {
  FOCUS: 25 * 60,
  SHORT: 5 * 60,
  LONG: 15 * 60,
};

function AppPageContent() {
  const { isConnected, isConnecting, isReconnecting, address } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    petData,
    hasPet,
    recordSession,
    gBalance,
    approveG,
    buyFood,
    revivePet,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    refetch,
    writeError,
    receiptError,
    isSigning,
    isProcessing,
    isLoadingPet,
    setNames,
    xp,
    totalTime,
    health,
    streak,
    streakBonus,
    weather,
    username,
    petName,
    lastAction,
    allowance,
    refetchAllowance,
    refetchGBalance,
    buySuperFood,
    buyEnergyDrink,
    buyShield,
    buyCosmetic,
    boostEndTime,
    shieldCount,
    activeCosmetic,
    toggleCosmetic,
    inventory,
    totalDonated,
    handleSyncImpact,
    isSyncImpactLoading,
    equippedCosmetics,
    isNight,
  } = useFocusPet();

  const { refetch: refetchLeaderboard } = useLeaderboard();
  const { isVerifying, setIsVerifying, isVerified } = useIdentity();
  const {
    isStreaming,
    flowRate,
    lastUpdated,
    globalUbiBalance,
    startSupercharge,
    stopSupercharge,
  } = useStreaming();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempUsername, setTempUsername] = useState(username || "");
  const [tempPetName, setTempPetName] = useState(petName || "");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [focusNote, setFocusNote] = useState("");
  const [lastSessionDuration, setLastSessionDuration] = useState(25);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [mood, setMood] = useState<PetMood>("happy");
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncedHash, setSyncedHash] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const showToast = (
    title: string,
    message: string,
    type: "success" | "error" | "info" | "achievement" = "success",
    showShare = false,
    shareText = "",
  ) => {
    if (type === "success" || type === "achievement") {
      toast.success(
        (t: Toast) => (
          <div className="flex flex-col">
            <span className="font-bold">{title}</span>
            <span className="text-sm">{message}</span>
            {showShare && (
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                  window.open(url, "_blank");
                }}
                className="mt-2 bg-indigo-500 text-white text-xs px-3 py-1 rounded-md w-fit hover:bg-indigo-600 transition-colors"
              >
                Share
              </button>
            )}
          </div>
        ),
        { duration: 5000 },
      );
    } else if (type === "error") {
      toast.error(`${title}\n${message}`);
    } else {
      toast(`${title}\n${message}`, { icon: "ℹ️" });
    }
  };

  const { playSound } = useAudio();

  useEffect(() => {
    const hasSeen = localStorage.getItem("focus-pet-onboarding");
    if (!hasSeen) {
      setShowOnboarding(true);
    }
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem("focus-pet-onboarding", "true");
    setShowOnboarding(false);
  };

  const [hasAutoOpened, setHasAutoOpened] = useState(false);

  useEffect(() => {
    if (username) setTempUsername(username);
    if (petName) setTempPetName(petName);

    // Auto-open naming modal for new adopters (only once per session)
    if (
      hasPet &&
      !username &&
      !isLoadingPet &&
      !isProcessing &&
      !isSyncing &&
      !hasAutoOpened
    ) {
      setIsEditModalOpen(true);
      setHasAutoOpened(true);
    }
  }, [
    username,
    petName,
    hasPet,
    isLoadingPet,
    isProcessing,
    isSyncing,
    hasAutoOpened,
  ]);

  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;

    // Only redirect if fully mounted and not in the middle of a critical process
    if (
      hasMounted &&
      !isConnected &&
      !isConnecting &&
      !isReconnecting &&
      !isProcessing &&
      !isSyncing
    ) {
      // Mobile Resilience: Add a generous 10-second buffer (15s if in a session) 
      // to let mobile wallets/Privy re-sync after returning from the background.
      const hasActiveSession = localStorage.getItem("focus-session");
      const bufferTime = hasActiveSession ? 15000 : 10000;

      redirectTimer = setTimeout(() => {
        // Double check state before final redirect
        if (!isConnected && !isConnecting && !isReconnecting) {
          router.push("/");
        }
      }, bufferTime);
    }

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [
    isConnected,
    isConnecting,
    isReconnecting,
    isProcessing,
    isSyncing,
    router,
    hasMounted,
  ]);

  // Verification Success Listener
  useEffect(() => {
    const isVerified = searchParams.get("isVerified");
    if (isVerified === "true") {
      // CELEBRATION!
      confetti({
        particleCount: 200,
        spread: 100,
        origin: { y: 0.5 },
        colors: ["#6366f1", "#10b981", "#3b82f6"],
      });
      playSound("success");

      // Clean up URL to avoid repeating on refresh
      const newPath = window.location.pathname;
      window.history.replaceState({}, "", newPath);
    }
  }, [searchParams]);

  useEffect(() => {
    const syncData = async () => {
      if (isConfirmed && hash && hash !== syncedHash) {
        setIsSyncing(true);
        setSyncedHash(hash);

        try {
          // Parallelize refetching for speed
          await Promise.all([
            refetch(),
            refetchLeaderboard(),
            refetchAllowance(),
            typeof refetchGBalance === "function"
              ? (refetchGBalance as () => void)()
              : Promise.resolve(),
          ]);

          router.refresh();

          // Celebration logic...
          if (lastAction === "focus") {
            confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 },
              colors: ["#6366f1", "#8B5CF6", "#EC4899"],
            });
            playSound("success");
            showToast(
              "Focus Recorded! 🏆",
              "Your pet is growing stronger and your status is updated on-chain.",
              "achievement",
              true,
              `I just focused ${focusNote ? `on "${focusNote}" ` : ""}for ${lastSessionDuration < 1 ? Math.round(lastSessionDuration * 60) + " seconds" : lastSessionDuration + " minutes"} with FocusPet! 🦅 My pet is leveling up on Celo. #FocusPet #BuildWithCelo`,
            );
          } else if (lastAction === "shop") {
            showToast(
              "Shop Success! 🛍️",
              "Your items have been delivered and your pet is happy.",
              "success",
              true,
              `I just bought a new item for my @FocusPet! 🛍️ My productivity is paying off. #FocusPet #Celo`,
            );
            playSound("pop");
          } else if (lastAction === "profile") {
            showToast(
              "Profile Updated! 👤",
              "Your on-chain identity has been saved successfully.",
              "info",
            );
          }
        } catch (error) {
          console.error("Sync error:", error);
        } finally {
          setIsSyncing(false);
        }
      }
    };

    syncData();
  }, [
    isConfirmed,
    hash,
    syncedHash,
    lastAction,
    refetch,
    refetchAllowance,
    refetchGBalance,
    router,
  ]);

  // Parse BigInt data from contract
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pet = petData as any;
  const stage = getPetStage(xp);
  const nextStageInfo = getNextStageInfo(xp);

  // Level Up Ceremony Detection
  const [prevStage, setPrevStage] = useState<PetStage | null>(null);

  useEffect(() => {
    if (pet && !isLoadingPet) {
      const currentStage = getPetStage(Number(pet[0]));
      if (prevStage && prevStage !== currentStage) {
        // LEVEL UP CEREMONY!
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.3 },
          colors: ["#fbbf24", "#f59e0b", "#d97706"], // Gold colors
          shapes: ["star"],
        });
        playSound("success");
      }
      setPrevStage(currentStage);
    }
  }, [xp, isLoadingPet, pet, prevStage]);

  const handleSessionComplete = (minutes: number) => {
    setLastSessionDuration(minutes);

    // Calculate Supercharge Multiplier for XP Toast
    const monthlyAmount =
      isStreaming && flowRate
        ? Number(formatEther(flowRate * BigInt(30 * 24 * 60 * 60)))
        : 0;
    const superchargeMultiplier =
      monthlyAmount >= 90
        ? 1.7
        : monthlyAmount >= 45
          ? 1.4
          : monthlyAmount >= 9
            ? 1.2
            : 1.0;

    recordSession(minutes, superchargeMultiplier);
    setMood("happy");
    playSound("click");
  };

  // Rendering logic moved to bottom to comply with Rules of Hooks

  // Account-Based: If they don't have a pet yet (birthTime == 0),
  // we can show a welcome screen, but technically they can just start "Focusing" to get one.
  // For better UX, let's keep the "Adopt" screen but make it a simple "Start Journey" button
  // that maybe triggers a 0-minute session or just explains they can start focusing.
  // OR, since the contract initializes on first action, we can just show the empty egg state.

  // --- Conditional Rendering Blocks ---
  if (!hasMounted) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Loader2 style={{ width: 28, height: 28, color: "#E05C28" }} className="animate-spin" />
      </div>
    );
  }

  if (!isConnected) {
    if (isConnecting || isReconnecting) {
      return (
        <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <Loader2 style={{ width: 28, height: 28, color: "#E05C28" }} className="animate-spin" />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#8A8478", letterSpacing: "0.05em" }}>Connecting to Celo…</p>
        </div>
      );
    }
    return null;
  }

  if (isLoadingPet) {
    return (
      <div style={{ minHeight: "100vh", background: "#FAF7F2", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          style={{ width: 28, height: 28, border: "3px solid #EDE7DC", borderTopColor: "#E05C28", borderRadius: "50%" }}
        />
        <p style={{ fontSize: 13, fontWeight: 600, color: "#8A8478", letterSpacing: "0.05em" }}>Syncing with Celo…</p>
      </div>
    );
  }

  if (!hasPet) {
    const FONT_DISPLAY = "var(--font-syne), var(--font-geist-sans)";
    const C = {
      bg: "#FAF7F2", surface: "#FFFFFF",
      border: "#EDE7DC", border2: "#E0D9CE",
      text1: "#1C1A16", text2: "#8A8478", text3: "#C4BDB3",
      orange: "#E05C28", orangeLight: "#FEF0E8",
      green: "#2E7A4F", greenLight: "#EBF5EE",
    };

    const MINI_STAGES = [
      { emoji: "🐣", image: "/assets/pets/cyber_dino/baby_sunny.png",  label: "Baby",  time: "1h"   },
      { emoji: "🦖", image: "/assets/pets/cyber_dino/adult_sunny.png", label: "Teen",  time: "30h"  },
      { emoji: "🐉", image: null,                                       label: "Adult", time: "100h" },
      { emoji: "👑", image: null,                                       label: "Elder", time: "250h" },
    ];

    return (
      <div style={{ minHeight: "100vh", background: C.bg, overflowX: "hidden", fontFamily: "var(--font-geist-sans)" }}>

        {/* Minimal nav */}
        <header style={{ height: 58, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", padding: "0 32px" }}>
          <div style={{ maxWidth: 1100, width: "100%", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/focus-pet-logo.jpeg" alt="FocusPet" style={{ width: 28, height: 28, borderRadius: "50%" }} />
              <span style={{ fontWeight: 800, fontSize: 15, fontFamily: FONT_DISPLAY, letterSpacing: "-0.02em", color: C.text1 }}>FocusPet</span>
            </div>
            <button
              onClick={() => setShowOnboarding(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: C.text2, background: "transparent", border: "none", cursor: "pointer" }}
            >
              <HelpCircle size={15} /> How it works
            </button>
          </div>
        </header>

        {/* Main content */}
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "64px 32px", display: "flex", alignItems: "center", gap: 80, flexWrap: "wrap" }}>

          {/* Left — text */}
          <div style={{ flex: "1 1 380px", minWidth: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] as unknown as never }}
              style={{ marginBottom: 16 }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, padding: "5px 14px", borderRadius: 20, background: C.orangeLight, color: C.orange }}>
                New trainer
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.08, ease: [0.22, 1, 0.36, 1] as unknown as never }}
              style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: "clamp(40px, 5.5vw, 68px)", lineHeight: 1.02, letterSpacing: "-0.04em", color: C.text1, marginBottom: 20 }}
            >
              Something<br />wonderful<br />is inside.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] as unknown as never }}
              style={{ fontSize: 16, lineHeight: 1.75, color: C.text2, maxWidth: 380, marginBottom: 36 }}
            >
              Your pet is waiting to hatch. Tap the button below to mint it on Celo
              and begin your focus journey. It takes just a second.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] as unknown as never }}
              style={{ display: "flex", flexDirection: "column" as const, gap: 14, alignItems: "flex-start" }}
            >
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  playSound("click");
                  await handleSessionComplete(0);
                }}
                disabled={isProcessing}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "15px 32px", borderRadius: 12,
                  fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 16,
                  background: isProcessing ? C.text3 : C.orange,
                  color: "#fff", border: "none", cursor: isProcessing ? "not-allowed" : "pointer",
                  letterSpacing: "-0.01em", transition: "background 0.2s",
                }}
              >
                {isProcessing ? (
                  <>
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      style={{ width: 16, height: 16, border: "2.5px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                    Hatching…
                  </>
                ) : (
                  "Hatch my pet 🥚"
                )}
              </motion.button>

              <p style={{ fontSize: 12, color: C.text3, fontWeight: 500 }}>
                Minted on Celo · Gas covered · Yours forever
              </p>
            </motion.div>

            {/* Evolution preview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.38, ease: [0.22, 1, 0.36, 1] as unknown as never }}
              style={{ marginTop: 48 }}
            >
              <p style={{ fontSize: 11, fontWeight: 700, color: C.text3, letterSpacing: "0.1em", textTransform: "uppercase" as const, marginBottom: 14 }}>
                Your pet could become →
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                {MINI_STAGES.map((s, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 + i * 0.07, duration: 0.4, ease: [0.22, 1, 0.36, 1] as unknown as never }}
                    style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4, padding: "10px 12px", borderRadius: 12, background: C.surface, border: `1px solid ${C.border}`, minWidth: 64 }}
                  >
                    {s.image
                      ? <img src={s.image} alt={s.label} style={{ width: 36, height: 36, objectFit: "contain" }} />
                      : <span style={{ fontSize: 28 }}>{s.emoji}</span>
                    }
                    <span style={{ fontSize: 10, fontWeight: 700, color: C.text1 }}>{s.label}</span>
                    <span style={{ fontSize: 9, color: C.text3 }}>{s.time}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right — egg */}
          <div style={{ flex: "1 1 300px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] as unknown as never }}
              style={{ display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 24 }}
            >
              {/* Card */}
              <div style={{
                background: C.surface, borderRadius: 28, padding: "40px 36px",
                border: `1px solid ${C.border}`,
                boxShadow: "0 4px 6px rgba(0,0,0,0.03), 0 20px 60px rgba(0,0,0,0.08)",
                display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 20, textAlign: "center" as const,
              }}>
                {/* Egg */}
                <motion.div
                  animate={{ y: [0, -14, 0], rotate: [-2, 2, -2] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
                  style={{ position: "relative" as const }}
                >
                  <img
                    src="/assets/pets/cyber_dino/egg_sunny.png"
                    alt="Your egg"
                    style={{ width: 160, height: 160, objectFit: "contain" }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  />
                  {/* Fallback emoji if image fails */}
                  <motion.div
                    animate={{ y: [0, -14, 0], rotate: [-2, 2, -2] }}
                    transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
                    style={{ fontSize: 100, lineHeight: 1, display: "none" }}
                  >🥚</motion.div>

                  {/* "tap to hatch" bubble */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ delay: 1.2, duration: 0.4, ease: [0.22, 1, 0.36, 1] as unknown as never }}
                    style={{
                      position: "absolute" as const, top: -8, right: -48,
                      background: C.orangeLight, border: `1px solid #F4C9B3`,
                      padding: "5px 10px", borderRadius: 20,
                      fontSize: 10, fontWeight: 700, color: C.orange,
                      whiteSpace: "nowrap" as const,
                    }}
                  >
                    ✨ Ready to hatch
                  </motion.div>
                </motion.div>

                {/* Shadow */}
                <motion.div
                  animate={{ scaleX: [1, 0.85, 1], opacity: [0.25, 0.15, 0.25] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
                  style={{ width: 80, height: 10, borderRadius: "50%", background: C.text1, filter: "blur(8px)" }}
                />

                <div>
                  <p style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 18, letterSpacing: "-0.02em", color: C.text1, marginBottom: 4 }}>
                    Your Egg
                  </p>
                  <p style={{ fontSize: 12, color: C.text2 }}>Quietly waiting…</p>
                </div>

                {/* Heartbeat dots */}
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {[0, 0.3, 0.6].map((d, i) => (
                    <motion.div
                      key={i}
                      animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
                      transition={{ repeat: Infinity, duration: 1.5, delay: d, ease: "easeInOut" }}
                      style={{ width: 6, height: 6, borderRadius: "50%", background: C.orange }}
                    />
                  ))}
                </div>
              </div>

              <p style={{ fontSize: 12, color: C.text3, textAlign: "center" as const, maxWidth: 220 }}>
                Stage 1 of 5 · Focus to unlock<br />each evolution
              </p>
            </motion.div>
          </div>
        </div>

        {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}

        {/* Processing overlay */}
        <AnimatePresence>
          {(isProcessing || isSyncing) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed" as const, inset: 0, background: "rgba(250,247,242,0.92)",
                backdropFilter: "blur(12px)", zIndex: 50,
                display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 20, padding: 24,
              }}
            >
              <motion.div
                animate={{ y: [0, -16, 0], rotate: [-3, 3, -3] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                style={{ fontSize: 88, lineHeight: 1 }}
              >
                🐣
              </motion.div>

              <div style={{ textAlign: "center" as const }}>
                <h2 style={{ fontFamily: FONT_DISPLAY, fontWeight: 800, fontSize: 32, letterSpacing: "-0.04em", color: C.text1, marginBottom: 8 }}>
                  Hatching…
                </h2>
                <p style={{ fontSize: 15, color: C.text2, lineHeight: 1.65 }}>
                  {isSigning ? "Preparing your reward…"
                    : isPending ? "Please confirm in your wallet…"
                    : isConfirming ? "Waking up your new friend…"
                    : "Almost there…"}
                </p>
              </div>

              {hash && (
                <a href={`https://celoscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: C.orange, textDecoration: "none", padding: "8px 16px", borderRadius: 20, background: C.orangeLight, border: `1px solid #F4C9B3` }}
                >
                  View on CeloScan <ExternalLink size={12} />
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const FD = "var(--font-syne), var(--font-geist-sans)";

  const fmtTime = (s: number) =>
    s >= 3600
      ? `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
      : s >= 60
        ? `${Math.floor(s / 60)}m`
        : `${s}s`;

  return (
    <div style={{ minHeight: "100vh", background: "#FAF7F2", fontFamily: "var(--font-geist-sans)" }}>
      <Navbar
        onOpenOnboarding={() => setShowOnboarding(true)}
        onOpenProfile={() => setIsEditModalOpen(true)}
      />

      <main
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "24px 20px 80px",
        }}
      >
        {/* ── 2-column grid ── */}
        <div
          style={{
            display: "flex",
            gap: 20,
            alignItems: "stretch",
            flexWrap: "wrap",
          }}
        >
          {/* LEFT: Pet card */}
          <div style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16, minHeight: 0 }}>

            {/* Identity strip */}
            <div
              style={{
                background: "#fff",
                borderRadius: 20,
                border: "1px solid #E8E0D5",
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <h2
                    style={{
                      fontFamily: FD,
                      fontWeight: 800,
                      fontSize: 20,
                      color: "#1C1A16",
                      letterSpacing: "-0.03em",
                      margin: 0,
                    }}
                  >
                    {petName || "Unnamed"}
                  </h2>
                  <button
                    onClick={() => { setIsEditModalOpen(true); playSound("click"); }}
                    style={{
                      background: "none", border: "none", cursor: "pointer",
                      color: "#B0A89E", padding: 2, display: "flex", alignItems: "center",
                    }}
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
                <p style={{ fontSize: 13, color: "#7A7067", fontWeight: 600, margin: 0 }}>
                  @{username || "focuser"}
                </p>
              </div>

              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#B0A89E", margin: "0 0 2px" }}>
                  Total Focus
                </p>
                <p style={{ fontFamily: FD, fontWeight: 800, fontSize: 18, color: "#1C1A16", margin: 0, letterSpacing: "-0.02em" }}>
                  {fmtTime(totalTime)}
                </p>
              </div>
            </div>

            {/* PetView */}
            <div style={{ borderRadius: 20, overflow: "hidden", flex: 1, minHeight: 0 }}>
              <PetView
                stage={stage}
                health={health}
                xp={xp}
                mood={mood}
                nextStageInfo={nextStageInfo}
                streak={streak}
                weather={weather}
                activeCosmetic={activeCosmetic}
                equippedCosmetics={equippedCosmetics}
                focusNote={focusNote}
                isVerified={isVerified}
                isNight={isNight}
              />
            </div>
          </div>

          {/* RIGHT: Timer + Claim */}
          <div style={{ flex: "1 1 340px", minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <FocusTimer
              onComplete={handleSessionComplete}
              onFail={() => setMood("sad")}
              onStart={(note) => {
                setMood("focused");
                if (note) setFocusNote(note);
                if (weather === "rainy" || weather === "stormy") {
                  showToast("Coming home?", "The clouds are beginning to clear...", "success");
                }
              }}
              onPause={() => setMood("sleeping")}
              onNoteChange={setFocusNote}
              isSupercharged={isStreaming}
              streak={streak}
            />

            {/* GoodDollar Daily Reward */}
            <ClaimReward />
          </div>
        </div>

        {/* ── Full-width sections ── */}
        <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <ImpactDashboard
            totalDonated={totalDonated}
            xp={xp}
            isStreaming={isStreaming}
            flowRate={flowRate}
            lastUpdated={lastUpdated}
            globalUbiBalance={globalUbiBalance}
            onSync={handleSyncImpact}
            isSyncing={isSyncImpactLoading}
          />

          <PetShop
            gBalance={gBalance as bigint | undefined}
            health={health}
            isPending={isPending}
            isSuccess={isConfirmed}
            writeError={writeError}
            receiptError={receiptError}
            onBuyFood={buyFood}
            onBuySuperFood={buySuperFood}
            onBuyEnergyDrink={buyEnergyDrink}
            onBuyShield={buyShield}
            onBuyCosmetic={buyCosmetic}
            onToggleCosmetic={toggleCosmetic}
            inventory={inventory}
            onRevive={revivePet}
            playSound={playSound}
            showToast={showToast}
            boostEndTime={boostEndTime}
            shieldCount={shieldCount}
            equippedCosmetics={equippedCosmetics}
          />

          <Leaderboard />
        </div>

        {isPending && (
          <p style={{ textAlign: "center", fontSize: 12, color: "#E05C28", marginTop: 12 }}>
            Transaction pending…
          </p>
        )}
      </main>

      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}

      <NamingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(u, p) => {
          setNames(u, p);
          setIsEditModalOpen(false);
        }}
        initialUsername={tempUsername}
        initialPetName={tempPetName}
        isPending={isPending}
      />

      {/* Full Screen Loading Overlay */}
      <AnimatePresence>
        {(isProcessing || isSyncing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(250,247,242,0.94)",
              backdropFilter: "blur(14px)",
              zIndex: 50,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: 20, padding: 24,
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.3, ease: "linear" }}
              style={{
                width: 44, height: 44,
                border: "3px solid #EDE7DC",
                borderTopColor: "#E05C28",
                borderRadius: "50%",
              }}
            />
            <div style={{ textAlign: "center" }}>
              <h2 style={{
                fontFamily: "var(--font-syne), var(--font-geist-sans)",
                fontWeight: 800, fontSize: 22,
                letterSpacing: "-0.03em", color: "#1C1A16", marginBottom: 8,
              }}>
                {isSyncing ? "Updating your pet…" : "Processing…"}
              </h2>
              <p style={{ fontSize: 14, color: "#7A7067", lineHeight: 1.6 }}>
                {isSigning ? "Preparing your rewards…"
                  : isSyncing ? "Syncing with Celo…"
                  : isPending ? "Confirm in your wallet…"
                  : isConfirming ? "Saving your progress…"
                  : "Almost there…"}
              </p>
            </div>
            {hash && (
              <a
                href={`https://celoscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 700, color: "#E05C28",
                  textDecoration: "none", padding: "8px 16px",
                  borderRadius: 20, background: "#FFF0EA",
                  border: "1px solid #F4C9B3",
                }}
              >
                View on CeloScan <ExternalLink size={12} />
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center text-neutral-500 font-medium italic">
          Loading FocusPet...
        </div>
      }
    >
      <AppPageContent />
    </Suspense>
  );
}
