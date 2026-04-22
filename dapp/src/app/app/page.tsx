"use client";
import React from "react";
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
import { useState, useEffect, useCallback } from "react";
import { useFocusPet } from "@/hooks/useFocusPet";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { PetShop } from "@/components/PetShop";
import { useIdentity } from "@/hooks/useIdentity";

import { useAccount, useReconnect, useBalance, useDisconnect } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { formatEther, parseEther } from "viem";
import { PrivyConnectButton } from "@/components/PrivyConnectButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SocialShare } from "@/components/SocialShare";
import { OnboardingModal } from "@/components/OnboardingModal";
import { SuperchargeModal } from "@/components/SuperchargeModal";
import { BoostsSheet } from "@/components/BoostsSheet";
import dynamic from "next/dynamic";
const ClaimReward = dynamic(
  () => import("@/components/ClaimReward").then((mod) => mod.ClaimReward),
  { ssr: false },
);
// TODO: Engagement rewards — uncomment when cleared for launch
// const EngagementRewardBanner = dynamic(
//   () =>
//     import("@/components/EngagementRewardBanner").then(
//       (mod) => mod.EngagementRewardBanner,
//     ),
//   { ssr: false },
// );
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
  Clock,
  Share2,
  Menu,
  Copy,
  Heart,
  Zap,
  FastForward,
} from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import toast, { Toast } from "react-hot-toast";
import { useAudio } from "@/hooks/useAudio";
import { SoundMenu } from "@/components/SoundMenu";
import { StreakFlame } from "./../../components/StreakFlame";
import { NamingModal } from "@/components/NamingModal";
import { useStreaming } from "@/hooks/useStreaming";
import { Navbar } from "@/components/Navbar";
import { IOSInstallPrompt } from "@/components/IOSInstallPrompt";
import { AppWelcome } from "@/components/AppWelcome";
import { DailyActionButton } from "@/components/DailyActionButton";

import { Suspense } from "react";

const TIMERS = {
  FOCUS: 25 * 60,
  SHORT: 5 * 60,
  LONG: 15 * 60,
};

function AppPageContent() {
  const { isConnected, isConnecting, isReconnecting, address } = useAccount();
  const { logout, authenticated, ready: privyReady } = usePrivy();
  const { reconnect } = useReconnect();
  const { disconnect } = useDisconnect();
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

  // Poll aggressively only while waiting for faucet gas on the hatch screen.
  // MiniPay users pay gas via cUSD — no need to poll CELO balance for them.
  // Once user has a pet, drop back to default (no continuous polling).
  const isMiniPayEnv =
    typeof window !== "undefined" && !!(window.ethereum as any)?.isMiniPay;
  const { data: celoBalance } = useBalance({
    address,
    query: { refetchInterval: !hasPet && !isMiniPayEnv ? 3000 : false },
  });

  const { refetch: refetchLeaderboard } = useLeaderboard();
  const { isVerifying, setIsVerifying, isVerified } = useIdentity();
  const {
    isStreaming,
    isStreamPending,
    flowRate,
    lastUpdated,
    globalUbiBalance,
    startSupercharge,
    stopSupercharge,
  } = useStreaming();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSuperchargeOpen, setIsSuperchargeOpen] = useState(false);
  const [isBoostsOpen, setIsBoostsOpen] = useState(false);
  const [isFocusing, setIsFocusing] = useState(false);
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
  const [walletConnectTimedOut, setWalletConnectTimedOut] = useState(false);
  const [petLoadTimedOut, setPetLoadTimedOut] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (username) setTempUsername(username);
    if (petName) setTempPetName(petName);
  }, [username, petName]);

  // Safety timeout: if authenticated but wagmi never connects after 15s, the user
  // likely has an external wallet or their iOS Safari cleared Privy's IndexedDB key shares.
  useEffect(() => {
    if (!authenticated || isConnected) {
      setWalletConnectTimedOut(false);
      return;
    }
    const t = setTimeout(() => setWalletConnectTimedOut(true), 15000);
    return () => clearTimeout(t);
  }, [authenticated, isConnected]);

  // Safety timeout: if connected but contract reads never resolve after 15s,
  // the RPC is down or unreachable. Force-proceed so the user isn't stuck forever.
  useEffect(() => {
    if (!isConnected || !isLoadingPet) {
      setPetLoadTimedOut(false);
      return;
    }
    const t = setTimeout(() => setPetLoadTimedOut(true), 15000);
    return () => clearTimeout(t);
  }, [isConnected, isLoadingPet]);

  const showToast = useCallback(
    (
      title: string,
      message: string,
      type: "success" | "error" | "info" | "achievement" = "success",
      showShare = false,
      shareText = "",
    ) => {
      const content = showShare
        ? (t: Toast) => (
            <span className="flex items-center gap-3">
              <span>
                {title} — {message}
              </span>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
                    "_blank",
                  );
                }}
                className="shrink-0 px-3 py-1 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors"
              >
                Share
              </button>
            </span>
          )
        : `${title} — ${message}`;

      if (type === "error") {
        toast.error(
          typeof content === "string" ? content : `${title} — ${message}`,
        );
      } else if (type === "info") {
        toast(typeof content === "string" ? content : `${title} — ${message}`, {
          icon: "ℹ️",
        });
      } else {
        toast.success(content as any, { duration: 5000 });
      }
    },
    [],
  );

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
  const [gasTimedOut, setGasTimedOut] = useState(false);

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

  // If the user has no pet and no gas arrives within 40 s, stop spinning and
  // show a fallback message so they're never stuck forever.
  // MiniPay users pay gas via cUSD — skip this timer entirely.
  useEffect(() => {
    if (hasPet) return;
    const isMiniPay =
      typeof window !== "undefined" && !!(window.ethereum as any)?.isMiniPay;
    if (isMiniPay) {
      setGasTimedOut(false);
      return;
    }
    const hasGas = (celoBalance?.value ?? 0n) >= parseEther("0.003");
    if (hasGas) {
      setGasTimedOut(false);
      return;
    }
    const t = setTimeout(() => setGasTimedOut(true), 40_000);
    return () => clearTimeout(t);
  }, [hasPet, celoBalance]);

  // No redirect on logout or connection drop — /app handles its own disconnected state.
  // The "Your pet is waiting" screen is the correct destination for returning users.
  // / is only for direct navigation (marketing page for new visitors).

  // Open profile modal when redirected from another page with ?openProfile=true
  useEffect(() => {
    if (searchParams.get("openProfile") === "true") {
      setIsEditModalOpen(true);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [searchParams]);

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
            setIsEditModalOpen(false);
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

  useEffect(() => {
    if (authenticated && walletConnectTimedOut) {
      disconnect();
      logout();
    }
  }, [authenticated, walletConnectTimedOut]);

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
    return <AppLoadingScreen />;
  }

  // Show welcome/auth screen for unauthenticated non-MiniPay users
  const isMiniPay =
    typeof window !== "undefined" && !!(window.ethereum as any)?.isMiniPay;
  if (privyReady && !authenticated && !isMiniPay) {
    return <AppWelcome />;
  }

  if (!isConnected) {
    const miniPay =
      typeof window !== "undefined" && !!(window.ethereum as any)?.isMiniPay;

    const isAutoConnecting =
      !walletConnectTimedOut &&
      (isConnecting ||
        isReconnecting ||
        miniPay ||
        !privyReady ||
        (privyReady && authenticated));

    if (isAutoConnecting) {
      return <AppLoadingScreen miniPay={miniPay} />;
    }

    // Wallet never connected after timeout — silently sign out and send them
    // back to the login screen. This is the actual recovery path and avoids
    // showing technical jargon about browser extensions to mobile users.
    if (authenticated && walletConnectTimedOut) {
      return <AppLoadingScreen />;
    }

    return <AppLoadingScreen />;
  }

  if (isLoadingPet && !petLoadTimedOut) {
    return <AppLoadingScreen />;
  }

  if (!hasPet) {
    const isMiniPayHatch =
      typeof window !== "undefined" &&
      !!(window.ethereum as any)?.isMiniPay;
    const hasGas =
      isMiniPayHatch || (celoBalance?.value ?? 0n) >= parseEther("0.003");

    return (
      <div className="min-h-screen w-screen overflow-x-hidden bg-black flex flex-col">
        <Navbar minimal onOpenOnboarding={() => setShowOnboarding(true)} />

        <div className="flex-1 flex flex-col items-center justify-center px-5 py-16">
          {/* Egg visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative mb-12 flex items-center justify-center"
          >
            <motion.div
              animate={{ opacity: [0.04, 0.14, 0.04], scale: [1, 1.18, 1] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-white blur-3xl"
            />
            <motion.img
              src="/assets/pets/cyber_dino/egg_sunny.png"
              alt="Your egg"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-44 h-44 object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.08)]"
            />
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center mb-10 max-w-xs"
          >
            <h1 className="text-4xl sm:text-5xl font-medium text-white mb-3 tracking-tight">
              A companion awaits
            </h1>
            <p className="text-neutral-500 text-base leading-relaxed">
              Start your first focus session to bring your pet to life.
            </p>
          </motion.div>

          {/* Action */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="w-full max-w-sm flex flex-col gap-4"
          >
            {hasGas ? (
              <button
                onClick={async () => {
                  playSound("hatch");
                  await handleSessionComplete(0);
                }}
                disabled={isProcessing}
                className="w-full py-3.5 rounded-full bg-white hover:bg-neutral-100 text-black font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get pet
              </button>
            ) : gasTimedOut ? (
              <div className="flex flex-col gap-3">
                <p className="text-neutral-500 text-sm text-center leading-relaxed">
                  We couldn't top up your wallet. Send a small CELO to your address to continue.
                </p>
                <button
                  onClick={() => {
                    if (address) {
                      navigator.clipboard.writeText(address);
                      toast.success("Address copied!");
                    }
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-[#111111] hover:bg-[#1a1a1a] text-white font-mono text-xs transition-all border border-neutral-800 text-left flex items-center justify-between gap-2"
                >
                  <span className="truncate text-neutral-400">{address}</span>
                  <Copy size={13} className="shrink-0 text-neutral-500" />
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 rounded-full bg-[#111111] hover:bg-[#1a1a1a] text-white text-sm font-medium transition-all border border-neutral-800"
                >
                  Refresh & retry
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-neutral-500 shrink-0" />
                <p className="text-neutral-500 text-sm">Preparing your wallet…</p>
              </div>
            )}

            <button
              onClick={() => setShowOnboarding(true)}
              className="text-neutral-600 hover:text-neutral-400 text-sm transition-colors text-center"
            >
              How does this work?
            </button>
          </motion.div>
        </div>

        {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}

        {/* Hatching overlay */}
        <AnimatePresence>
          {(isProcessing || isSyncing || isStreamPending) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-8 p-6"
            >
              {/* Spinner */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <motion.div
                  animate={{ opacity: [0.05, 0.18, 0.05], scale: [1, 1.2, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-white blur-xl"
                />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/40 animate-spin" />
                <div className="absolute inset-3 rounded-full border border-transparent border-b-white/20 animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
                <motion.div
                  animate={{ opacity: [0.2, 0.7, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 rounded-full bg-white"
                />
              </div>

              <div className="text-center">
                <h2 className="text-white text-2xl font-medium mb-2">
                  Hatching…
                </h2>
                <p className="text-neutral-500 text-sm">
                  {isSigning
                    ? "Preparing transaction…"
                    : isPending
                      ? "Confirm in your wallet…"
                      : isConfirming
                        ? "Waking up your companion…"
                        : "Almost there…"}
                </p>
              </div>

              {hash && (
                <a
                  href={`https://celoscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-300 text-xs transition-colors"
                >
                  View on CeloScan
                  <ExternalLink size={11} />
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const stageLevels: Record<string, number> = {
    egg: 1,
    baby: 2,
    teen: 3,
    adult: 4,
    elder: 5,
  };
  const stageLevel = stageLevels[stage] ?? 1;
  const totalHours = Math.floor(totalTime / 3600);
  const totalMins = Math.floor((totalTime % 3600) / 60);
  const totalSecs = totalTime % 60;

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar onOpenProfile={() => setIsEditModalOpen(true)} />

      <main className="px-5 sm:px-10 lg:px-[80px] py-[80px] pb-24">
        {/* ── Hero: Pet card + stats/timer ─────────────────────────────── */}
        <div className="flex flex-col lg:flex-row gap-5 items-center mb-10 gap-x-[107px]">
          {/* Left – XP/Health + PetView + level progress */}
          <div className="w-[85%] lg:w-[400px] shrink-0">
            {/* XP + Health above pet */}
            <div className="flex items-center gap-3 mb-3 justify-between">
              <div className="flex items-center gap-2 bg-[#FFFFFF33] border border-neutral-800 rounded-full py-[15px] px-6 text-xs lg:text-sm">
                Health
                <span className="text-white tabular-nums font-semibold">
                  {health}%
                </span>
              </div>

              <div className="bg-[#0F0F0F] text-xs lg:text-sm rounded-full flex items-center p-1">
                <div className="py-[15px] px-6">XP</div>
                <div className="py-[15px] px-6 bg-[#161616] rounded-full font-semibold">
                  {xp.toLocaleString()}
                </div>
              </div>
            </div>

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

          {/* Right – stats bar + info/timer card */}
          <div className="flex-1 min-w-0 flex flex-col gap-4">
            {streak > 0 && (
              <div className="flex items-center gap-3 lg:justify-between">
                <div
                  className="rounded-full flex items-center gap-2 py-2.5 px-5 border border-dashed border-[#664600] text-white text-sm font-medium whitespace-nowrap"
                  style={{
                    background:
                      "linear-gradient(90deg, #322000, #8B4500, #010101, #8B4500, #322000)",
                    backgroundSize: "300% 100%",
                    animation: "streakShift 5s ease infinite",
                  }}
                >
                  <img src="/streak-flame.png" className="w-5 h-5" alt="" />
                  <span className="flex items-center gap-x-1">
                    <span className="hidden lg:flex">You are on a </span>
                    {` ${streak}`} day streak
                  </span>
                </div>

                <DailyActionButton />
              </div>
            )}
            {/* Stats bar */}
            <div className="flex flex-wrap gap-3 items-center">
              {/* Supercharge */}
              <button
                onClick={() => setIsSuperchargeOpen(true)}
                className="px-5 py-3 rounded-full text-sm font-medium whitespace-nowrap"
                style={
                  isStreaming
                    ? {
                        background:
                          "linear-gradient(90deg, #342804, #E73B74, #342804, #E73B74, #342804)",
                        backgroundSize: "300% 100%",
                        animation: "superchargeShift 4s ease infinite",
                        color: "#ffffff",
                      }
                    : { background: "#ffffff", color: "#000000" }
                }
              >
                {isStreaming ? (
                  <span className="flex items-center gap-2">
                    <Zap size={14} fill="#E1AA02" color="#E1AA02" />
                    Supercharged
                  </span>
                ) : (
                  "Supercharge"
                )}
              </button>

              {/* Boosts */}
              {(() => {
                const boostActive =
                  boostEndTime > Math.floor(Date.now() / 1000) ||
                  shieldCount > 0;
                return (
                  <button
                    onClick={() => setIsBoostsOpen(true)}
                    className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium whitespace-nowrap"
                    style={
                      boostActive
                        ? {
                            background:
                              "linear-gradient(90deg, #063D49, #3B4CE7, #063D49, #3B4CE7, #063D49)",
                            backgroundSize: "300% 100%",
                            animation: "boostShift 4s ease infinite",
                            color: "#ffffff",
                          }
                        : { background: "#ffffff", color: "#000000" }
                    }
                  >
                    {boostActive ? (
                      <span className="flex items-center gap-2">
                        <FastForward size={14} fill="#5FE2FE" color="#5FE2FE" />
                        Boosts
                      </span>
                    ) : (
                      "Boosts"
                    )}
                  </button>
                );
              })()}

              <div className="rounded-full flex lg:text-sm text-xs items-center basis-full md:basis-auto md:flex-1 bg-[#0F0F0F] p-1">
                <div className="py-3 px-6 whitespace-nowrap">
                  Level {stageLevel}: {getStageName(stage)}
                </div>
                <div className="py-3 flex-1 px-6 rounded-full gap-x-2 flex items-center bg-[#161616] text-sm">
                  <span>{Math.round(nextStageInfo.progress)}%</span>
                  <div className="h-[6px] flex-1 bg-[#252525] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#C48E57] rounded-full transition-all duration-700"
                      style={{ width: `${nextStageInfo.progress}%` }}
                    />
                  </div>
                  <span>100%</span>
                </div>
              </div>
            </div>

            {/* Main info + timer card — FocusTimer never unmounts; left panel animates on focus */}
            <div className="rounded-3xl overflow-hidden flex flex-col sm:flex-row h-fit">
              {/* Left – shrinks when focusing to give timer more room */}
              {/* Left – content fades out instantly, then width collapses */}
              <motion.div
                animate={{ width: isFocusing ? 0 : "50%" }}
                transition={{ type: "spring", stiffness: 320, damping: 60 }}
                className="hidden sm:flex shrink-0 bg-[#0F0F0F] flex-col justify-between overflow-hidden"
              >
                <motion.div
                  animate={{ opacity: isFocusing ? 0 : 1 }}
                  transition={{ duration: 0.12 }}
                  className="flex flex-col justify-between h-full p-10 min-w-[260px]"
                >
                  <div>
                    <h2 className="text-white text-3xl xl:text-[40px]/[1.1] font-medium mb-5 leading-tight capitalize whitespace-nowrap font-sans">
                      {petName || "Pet Name"}
                    </h2>
                    <div>
                      <p className="text-[#A9A9A9] text-base mb-1 font-medium">
                        Owner
                      </p>
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => {
                            setIsEditModalOpen(true);
                            playSound("click");
                          }}
                        >
                          <p className="text-white text-lg font-semibold truncate">
                            {username || "focuser"}
                          </p>
                        </button>
                        {isVerified && <img src="/SealCheck.svg" />}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[#A9A9A9] text-sm xl:text-base font-medium mb-1 whitespace-nowrap">
                      Total time
                    </p>
                    <p className="text-white text-2xl xl:text-[32px] font-mono tracking-wide whitespace-nowrap">
                      {`${totalHours}H ${String(totalMins).padStart(2, "0")}M ${String(totalSecs).padStart(2, "0")}S`}
                    </p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Mobile-only left panel — hidden while focusing */}
              <div className={`sm:hidden p-8 bg-[#0F0F0F] flex-col gap-5 ${isFocusing ? "hidden" : "flex"}`}>
                <div>
                  <h2 className="text-white text-3xl font-medium mb-4 leading-tight capitalize">
                    {petName || "Pet Name"}
                  </h2>
                  <div>
                    <p className="text-[#A9A9A9] text-sm mb-2 font-medium">
                      Owner
                    </p>
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => {
                          setIsEditModalOpen(true);
                          playSound("click");
                        }}
                        className="w-fit rounded-full flex items-center gap-x-2"
                      >
                        <p className="text-white text-base font-medium">
                          {username || "focuser"}
                        </p>
                      </button>
                      {isVerified && <img src="/SealCheck.svg" />}
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[#A9A9A9] text-sm font-medium mb-1">
                    Total time
                  </p>
                  <p className="text-white text-2xl font-mono tracking-wide">
                    {`${totalHours}H ${String(totalMins).padStart(2, "0")}M ${String(totalSecs).padStart(2, "0")}S`}
                  </p>
                </div>
              </div>

              {/* Dashed divider */}
              {!isFocusing && (
                <div className="hidden sm:block w-px border-l border-dashed border-neutral-800 shrink-0" />
              )}
              {!isFocusing && (
                <div className="sm:hidden h-px border-t border-dashed border-neutral-800" />
              )}

              {/* Right – flex-1 absorbs whatever the left gives up */}
              <div className="flex-1 min-w-0 p-10 bg-[#0C0C0C]">
                <FocusTimer
                  embedded
                  onComplete={(mins) => {
                    setIsFocusing(false);
                    handleSessionComplete(mins);
                  }}
                  onFail={() => {
                    setIsFocusing(false);
                    setMood("sad");
                  }}
                  onStop={() => {
                    setIsFocusing(false);
                    setMood("happy");
                  }}
                  onStart={(note) => {
                    setIsFocusing(true);
                    setMood("focused");
                    if (note) setFocusNote(note);
                    if (weather === "rainy" || weather === "stormy") {
                      showToast(
                        "Coming home? ✨",
                        "The clouds are beginning to clear...",
                        "success",
                      );
                    }
                  }}
                  onPause={() => setMood("sleeping")}
                  onNoteChange={setFocusNote}
                  isSupercharged={isStreaming}
                  streak={streak}
                  isNight={isNight}
                  boostEndTime={Number(boostEndTime)}
                  shieldCount={shieldCount}
                  streakBonus={streakBonus}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── Sections below the fold ──────────────────────────────────── */}
        {/* <ClaimReward /> */}

        {/* <ImpactDashboard
          totalDonated={totalDonated}
          xp={xp}
          isStreaming={isStreaming}
          flowRate={flowRate}
          lastUpdated={lastUpdated}
          globalUbiBalance={globalUbiBalance}
          onSync={handleSyncImpact}
          isSyncing={isSyncImpactLoading}
        /> */}

        {/* <PetShop
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
        /> */}

        {/* <Leaderboard /> */}
      </main>

      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}
      <IOSInstallPrompt />

      <BoostsSheet
        isOpen={isBoostsOpen}
        onClose={() => setIsBoostsOpen(false)}
        boostEndTime={boostEndTime}
        shieldCount={shieldCount}
      />

      <SuperchargeModal
        isOpen={isSuperchargeOpen}
        onClose={() => setIsSuperchargeOpen(false)}
        isStreaming={isStreaming}
        flowRate={flowRate ?? undefined}
        onStart={startSupercharge}
        onStop={stopSupercharge}
      />

      <NamingModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={(u, p) => setNames(u, p)}
        initialUsername={tempUsername}
        initialPetName={tempPetName}
        isPending={isPending}
      />

      {/* Full-screen processing overlay */}
      <AnimatePresence>
        {(isProcessing || isSyncing || isStreamPending) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-5 p-4"
          >
            {/* Pulsing ring */}
            <div className="relative w-20 h-20 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0, 0.15] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full bg-white"
              />
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0, 0.25] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
                className="absolute inset-0 rounded-full bg-white"
              />
              <div className="w-14 h-14 rounded-full border border-neutral-800 bg-[#111111] flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 rounded-full border-2 border-transparent border-t-white"
                />
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-white text-lg font-semibold mb-1">
                {isStreamPending
                  ? isStreaming
                    ? "Stopping Stream…"
                    : "Initiating Stream…"
                  : isSyncing
                    ? "Saving progress…"
                    : "Processing…"}
              </h2>
              <p className="text-neutral-500 text-sm">
                {isStreamPending
                  ? "Confirm the transaction in your wallet…"
                  : isSigning
                    ? "Preparing your rewards…"
                    : isSyncing
                      ? "Syncing with Celo…"
                      : isPending
                        ? "Confirm in your wallet…"
                        : isConfirming
                          ? "Writing to chain…"
                          : "Almost there…"}
              </p>
            </div>

            {hash && (
              <a
                href={`https://celoscan.io/tx/${hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-neutral-600 hover:text-neutral-400 text-xs transition-colors"
              >
                View on CeloScan
                <ExternalLink size={11} />
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AppLoadingScreen({ miniPay = false }: { miniPay?: boolean }) {
  const [slow, setSlow] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
      {/* Spinner ring */}
      <div className="relative w-20 h-20 flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.08, 0.2, 0.08] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-white blur-xl"
        />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/30 animate-spin" />
      </div>

      <div className="text-center">
        <p className="text-white text-sm font-medium">
          {miniPay ? "Opening in MiniPay…" : "Loading your pet…"}
        </p>
        {!miniPay && (
          <p className="text-neutral-600 text-xs mt-1">Syncing with Celo</p>
        )}
      </div>

      {slow && (
        <div className="flex flex-col items-center gap-2">
          <p className="text-neutral-600 text-xs">
            {miniPay
              ? "MiniPay connection is slow"
              : "Taking longer than usual"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-medium text-neutral-400 hover:text-white uppercase tracking-widest transition-colors"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-white/30 animate-spin" />
        </div>
      }
    >
      <AppPageContent />
    </Suspense>
  );
}
