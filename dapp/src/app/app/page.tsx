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
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRouter, useSearchParams } from "next/navigation";
import { formatEther } from "viem";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SocialShare } from "@/components/SocialShare";
import { OnboardingModal } from "@/components/OnboardingModal";
import { ClaimReward } from "@/components/ClaimReward";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Gift,
  Sparkles,
  AlertCircle,
  Loader2,
  ExternalLink,
  HelpCircle,
  User,
  Edit2,
  X,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useAudio } from "@/hooks/useAudio";
import { SoundMenu } from "@/components/SoundMenu";
import { StreakFlame } from "@/components/StreakFlame";
import { NamingModal } from "@/components/NamingModal";
import { useStreaming } from "@/hooks/useStreaming";

import { Suspense } from "react";

const TIMERS = {
  FOCUS: 25 * 60,
  SHORT: 5 * 60,
  LONG: 15 * 60,
};

function AppPageContent() {
  const { isConnected, isConnecting, isReconnecting } = useAccount();
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
  } = useFocusPet();

  const { refetch: refetchLeaderboard } = useLeaderboard();
  const { isVerifying, setIsVerifying, isVerified } = useIdentity();
  const { isStreaming, flowRate } = useStreaming();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempUsername, setTempUsername] = useState(username || "");
  const [tempPetName, setTempPetName] = useState(petName || "");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [focusNote, setFocusNote] = useState("");
  const [lastSessionDuration, setLastSessionDuration] = useState(25);

  const [mood, setMood] = useState<PetMood>("happy");
  const [isSyncing, setIsSyncing] = useState(false);
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
      toast.success(title, {
        description: message,
        action: showShare
          ? {
              label: "Share",
              onClick: () => {
                const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
                window.open(url, "_blank");
              },
            }
          : undefined,
      });
    } else if (type === "error") {
      toast.error(title, { description: message });
    } else {
      toast.info(title, { description: message });
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

  useEffect(() => {
    if (username) setTempUsername(username);
    if (petName) setTempPetName(petName);

    // Auto-open naming modal for new adopters
    if (hasPet && !username && !isLoadingPet && !isProcessing && !isSyncing) {
      setIsEditModalOpen(true);
    }

    // Auto-close modal once name is successfully saved and synced
    if (username && isEditModalOpen && !isProcessing && !isSyncing) {
      setIsEditModalOpen(false);
    }
  }, [
    username,
    petName,
    hasPet,
    isLoadingPet,
    isProcessing,
    isSyncing,
    isEditModalOpen,
  ]);

  useEffect(() => {
    if (!isConnected && !isConnecting && !isReconnecting) {
      router.push("/");
    }
  }, [isConnected, isConnecting, isReconnecting, router]);

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
      if (isConfirmed) {
        setIsSyncing(true);
        await refetch();
        await refetchLeaderboard();
        refetchAllowance();
        if (typeof refetchGBalance === "function") {
          (refetchGBalance as () => void)();
        }
        router.refresh();

        // Celebration confetti for focus sessions or level ups!
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
          );
          playSound("pop");
        } else if (lastAction === "profile") {
          showToast(
            "Profile Updated! 👤",
            "Your on-chain identity has been saved successfully.",
            "info",
          );
        }
        setIsSyncing(false);
      }
    };

    syncData();
  }, [
    isConfirmed,
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
    recordSession(minutes);
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
      <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!isConnected) {
    if (isConnecting || isReconnecting) {
      return (
        <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center text-neutral-500">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
          <p className="animate-pulse">Connecting to Celo...</p>
        </div>
      );
    }
    return null;
  }

  if (isLoadingPet) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center text-neutral-500">
        <div className="animate-spin text-4xl mb-4">🦅</div>
        <p className="animate-pulse">Finding your pet...</p>
      </div>
    );
  }

  if (!hasPet) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Immersive Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-purple-500/5 blur-[100px] rounded-full" />

        <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
          {/* Floating Egg Container */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative mb-12"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [-1, 1, -1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-[140px] leading-none drop-shadow-[0_0_30px_rgba(165,180,252,0.3)] select-none"
            >
              🥚
            </motion.div>

            {/* Soft Glow Under Egg */}
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-4 bg-indigo-500/20 blur-xl rounded-full animate-pulse" />

            {/* Thought Bubble */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 1.5, duration: 0.5 }}
              className="absolute -right-12 -top-4 bg-white/10 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-300"
            >
              Quietly waiting...
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <h1 className="text-5xl font-black mb-4 tracking-tighter bg-clip-text text-transparent bg-linear-to-b from-white to-white/60">
              Your Journey Awaits
            </h1>
            <p className="text-neutral-400 mb-10 text-lg font-medium leading-relaxed">
              Your pet is sleeping inside this egg. <br />
              Focus to give it the energy it needs to hatch.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="w-full flex flex-col gap-6"
          >
            {/* Glassmorphism Timer Card */}
            {/* Glassmorphism Hatch Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-linear-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-6 block">
                  Step 1: Introduction
                </span>

                <h2 className="text-2xl font-black text-white mb-2">
                  Ready to Meet?
                </h2>
                <p className="text-neutral-400 text-sm mb-8 max-w-[260px] leading-relaxed">
                  Your new companion is waiting to hatch. No waiting
                  required—let's begin your journey now.
                </p>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    playSound("hatch");
                    // Trigger immediate hatch logic
                    await handleSessionComplete(0);
                  }}
                  disabled={isProcessing}
                  onMouseEnter={() => playSound("hover")}
                  className="relative group/btn overflow-hidden bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black text-sm shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.5)] transition-all duration-300"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Sparkles size={16} className="text-indigo-400" />
                    HATCH NOW
                    <Sparkles size={16} className="text-indigo-400" />
                  </span>

                  {/* Button Sheen */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000 ease-in-out" />
                </motion.button>

                <p className="text-[10px] text-neutral-600 mt-6 font-medium italic">
                  Completing this action initializes your pet on-chain.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowOnboarding(true)}
              className="flex items-center justify-center gap-2 text-neutral-500 hover:text-white transition-colors font-bold text-sm tracking-wide"
            >
              <HelpCircle size={18} />
              How does this work?
            </button>
          </motion.div>
        </div>

        {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}

        {/* Loading Overlay */}
        <AnimatePresence>
          {(isProcessing || isSyncing) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/90 backdrop-blur-2xl z-50 flex flex-col items-center justify-center text-white p-4"
            >
              <div className="relative">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 bg-indigo-500/40 blur-3xl rounded-full"
                />
                <div className="text-9xl mb-12 relative z-10">🐣</div>
              </div>
              <h2 className="text-4xl font-black mb-4 tracking-tight">
                Hatching...
              </h2>
              <p className="text-neutral-400 text-center max-w-xs font-medium leading-relaxed mb-6">
                {isSigning
                  ? "Securing focus reward..."
                  : isPending
                    ? "Confirm in your wallet..."
                    : isConfirming
                      ? "Waking up your new friend..."
                      : "Almost there!"}
              </p>

              {/* View on Explorer Link */}
              {hash && (
                <a
                  href={`https://celoscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-colors bg-white/5 px-3 py-1.5 rounded-full border border-white/5"
                >
                  View on CeloScan
                  <ExternalLink size={12} />
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="p-4 px-4 md:px-20 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900">
        <div className="flex items-center gap-2">
          <img
            src="/focus-pet-logo.jpeg"
            className="rounded-full h-10 w-10 shadow-sm"
            alt="FocusPet Logo"
          />
          <h1 className="font-bold text-lg tracking-tight">FocusPet</h1>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium">
          <button
            onClick={() => {
              setShowOnboarding(true);
              playSound("click"); // Added sound
            }}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            title="How to Play"
          >
            <HelpCircle size={22} />
          </button>
          <ThemeToggle />
          <SoundMenu />
          <StreakFlame count={streak} />
          <button
            onClick={() => {
              setIsEditModalOpen(true);
              playSound("click"); // Added sound
            }}
            className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
            title="Edit Profile"
          >
            <User size={20} />
          </button>
          <ConnectButton
            accountStatus="avatar"
            chainStatus="none"
            showBalance={false}
          />
        </div>
      </header>

      <main className="flex flex-col items-center pt-8 px-4 max-w-3xl mx-auto pb-20 w-full">
        <div className="text-center mb-10 w-full">
          <h2 className="text-3xl font-black tracking-tight mb-1 flex items-center justify-center gap-2">
            {petName || "Unnamed Pet"}
            <button
              onClick={() => {
                setIsEditModalOpen(true);
                playSound("click");
              }}
              className="text-neutral-400 hover:text-indigo-500 transition-colors"
            >
              <Edit2 size={16} />
            </button>
          </h2>

          <div className="flex flex-col items-center gap-4 mt-2">
            <p className="text-neutral-500 font-bold flex items-center justify-center gap-1.5 bg-neutral-50 dark:bg-neutral-900/40 px-4 py-1.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
              <span className="opacity-60 text-[10px] uppercase tracking-wider font-black">
                By
              </span>
              <span className="text-indigo-500 font-extrabold text-sm">
                @{username || "focuser"}
              </span>
              <span className="w-1 h-1 bg-neutral-300 dark:bg-neutral-700 rounded-full mx-1" />
              <Clock size={14} className="text-indigo-500" />
              <span className="text-neutral-700 dark:text-neutral-300 font-black text-sm">
                {xp >= 3600
                  ? `${Math.floor(xp / 3600)}h ${Math.floor((xp % 3600) / 60)}m`
                  : xp >= 60
                    ? `${Math.floor(xp / 60)}m ${xp % 60}s`
                    : `${xp}s`}
              </span>
              <span className="opacity-60 text-[10px] uppercase tracking-wider font-black">
                Total
              </span>
            </p>
          </div>
        </div>

        <div className="w-full relative z-10">
          <PetView
            stage={stage}
            health={health}
            xp={xp}
            mood={mood}
            nextStageInfo={nextStageInfo}
            streak={streak}
            weather={weather}
            activeCosmetic={activeCosmetic}
            focusNote={focusNote}
            isVerified={isVerified}
          />
        </div>

        <div className="w-full relative z-20">
          <FocusTimer
            onComplete={handleSessionComplete}
            onStart={(note) => {
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
          />
        </div>

        {/* GoodDollar Daily Reward */}
        <ClaimReward />

        {/* Social Impact Dashboard */}
        <ImpactDashboard
          totalDonated={totalDonated}
          xp={xp}
          // isStreaming={isStreaming}
          flowRate={flowRate}
        />

        {/* Pet Shop Section */}
        <PetShop
          gBalance={gBalance as bigint | undefined}
          allowance={allowance}
          health={health}
          isPending={isPending}
          isSuccess={isConfirmed}
          writeError={writeError}
          receiptError={receiptError}
          onApprove={approveG}
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
          activeCosmetic={activeCosmetic}
        />

        {/* Social Leaderboard */}
        <Leaderboard />

        {isPending && (
          <p className="mt-4 text-xs text-indigo-500 animate-pulse text-center">
            Transaction pending...
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
      {(isProcessing || isSyncing) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white p-4">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <h2 className="text-2xl font-bold mb-2">Processing...</h2>
          <p className="text-neutral-300 text-center animate-pulse">
            {isSigning
              ? "Preparing your rewards..."
              : isPending
                ? "Please confirm in your wallet..."
                : isConfirming
                  ? "Saving your progress..."
                  : "Almost there..."}
          </p>
        </div>
      )}
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
