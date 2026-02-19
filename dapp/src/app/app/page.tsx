"use client";
import { FocusTimer } from "@/components/FocusTimer";
import { PetView } from "@/components/PetView";
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
import { NotificationToast, ToastType } from "@/components/NotificationToast";

import { Suspense } from "react";

const TIMERS = {
  FOCUS: 25 * 60,
  SHORT: 5 * 60,
  LONG: 15 * 60,
};

function AppPageContent() {
  const { isConnected } = useAccount();
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
    username,
    petName,
    lastAction,
    allowance,
    refetchAllowance,
    refetchGBalance,
  } = useFocusPet();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [tempUsername, setTempUsername] = useState("");
  const [tempPetName, setTempPetName] = useState("");
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{
    isVisible: boolean;
    title: string;
    message: string;
    type: ToastType;
    showShare?: boolean;
    shareText?: string;
  }>({
    isVisible: false,
    title: "",
    message: "",
    type: "success",
  });

  const showToast = (
    title: string,
    message: string,
    type: ToastType = "success",
    showShare = false,
    shareText = "",
  ) => {
    setToast({ isVisible: true, title, message, type, showShare, shareText });
  };

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
  }, [username, petName]);

  // Local state for UI responsiveness while tx confirms
  const [mood, setMood] = useState<PetMood>("happy");

  useEffect(() => {
    if (!isConnected) {
      router.push("/");
    }
  }, [isConnected, router]);

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

      // Clean up URL to avoid repeating on refresh
      const newPath = window.location.pathname;
      window.history.replaceState({}, "", newPath);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isConfirming) {
      // optimistically show loading or wait
    }
    if (isConfirmed) {
      refetch();
      refetchAllowance();
      if (typeof refetchGBalance === "function") {
        (refetchGBalance as () => void)();
      }
      router.refresh(); // Refresh Next.js server components/data if any

      // Celebration confetti for focus sessions or level ups!
      if (lastAction === "focus") {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#6366f1", "#8b5cf6", "#ec4899"],
        });
        showToast(
          "Focus Recorded! 🏆",
          "Your pet is growing stronger and your status is updated on-chain.",
          "achievement",
          true,
          `I just focused for 25 minutes with FocusPet! 🦅 My pet is leveling up on Celo. #FocusPet #BuildWithCelo`,
        );
      } else if (lastAction === "shop") {
        showToast(
          "Shop Success! 🛍️",
          "Your items have been delivered and your pet is happy.",
          "success",
        );
      } else if (lastAction === "profile") {
        showToast(
          "Profile Updated! 👤",
          "Your on-chain identity has been saved successfully.",
          "info",
        );
      }
    }
  }, [
    isConfirmed,
    isConfirming,
    lastAction,
    refetch,
    refetchAllowance,
    refetchGBalance,
    router,
  ]);

  // Parse BigInt data from contract
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pet = petData as any;
  const health = pet ? Number(pet[1]) : 100;
  const xp = pet ? Number(pet[0]) : 0;
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
      }
      setPrevStage(currentStage);
    }
  }, [xp, isLoadingPet, pet, prevStage]);

  const handleSessionComplete = (minutes: number) => {
    recordSession(minutes); // Record actual duration
    setMood("happy");
  };

  if (!isConnected) {
    return null; // Redirecting...
  }

  // Initial Loading State
  if (isLoadingPet) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center text-neutral-500">
        <div className="animate-spin text-4xl mb-4">🦅</div>
        <p className="animate-pulse">Finding your pet...</p>
      </div>
    );
  }

  // Account-Based: If they don't have a pet yet (birthTime == 0),
  // we can show a welcome screen, but technically they can just start "Focusing" to get one.
  // For better UX, let's keep the "Adopt" screen but make it a simple "Start Journey" button
  // that maybe triggers a 0-minute session or just explains they can start focusing.
  // OR, since the contract initializes on first action, we can just show the empty egg state.

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
                    // Trigger immediate hatch logic
                    await handleSessionComplete(0);
                  }}
                  disabled={isProcessing}
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
          {isProcessing && (
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
            onClick={() => setShowOnboarding(true)}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            title="How to Play"
          >
            <HelpCircle size={22} />
          </button>
          <ThemeToggle />
          <button
            onClick={() => setIsEditModalOpen(true)}
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

      <main className="flex flex-col items-center pt-8 px-4 max-w-2xl mx-auto pb-20">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black tracking-tight mb-1 flex items-center justify-center gap-2">
            {petName || "Unnamed Pet"}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-neutral-400 hover:text-indigo-500 transition-colors"
            >
              <Edit2 size={16} />
            </button>
          </h2>

          <div className="flex flex-col items-center gap-4 mt-2 mb-6">
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
                {xp >= 60 ? `${Math.floor(xp / 60)}h ${xp % 60}m` : `${xp}m`}
              </span>
              <span className="opacity-60 text-[10px] uppercase tracking-wider font-black">
                Total
              </span>
            </p>
          </div>
        </div>

        <PetView
          stage={stage}
          xp={xp}
          health={health}
          mood={mood}
          nextStageInfo={nextStageInfo}
        />

        <FocusTimer
          onComplete={handleSessionComplete}
          onStart={() => setMood("focused")}
          onPause={() => setMood("sleeping")}
        />

        {/* GoodDollar Daily Reward */}
        <ClaimReward />

        {/* Pet Shop Section */}
        <div className="w-full mt-8 bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 md:p-6 border border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-xl flex items-center gap-2">
              <span className="text-2xl">🛍️</span> Pet Shop
            </h2>
            <div className="text-right">
              <p className="text-xs text-neutral-500 uppercase font-semibold">
                Your Balance
              </p>
              <p className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {gBalance
                  ? parseFloat(formatEther(gBalance as bigint)).toFixed(2)
                  : "0.00"}{" "}
                G$
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {allowance === BigInt(0) && (
              <div className="col-span-2 animate-in fade-in slide-in-from-top-2 duration-500">
                <button
                  onClick={() =>
                    approveG(
                      BigInt(
                        "115792089237316195423570985008687907853269984665640564039457584007913129639935",
                      ),
                    )
                  } // Infinite Approval
                  className="w-full bg-indigo-600 dark:bg-indigo-600 text-white py-4 px-6 rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex flex-col items-center gap-1 group"
                >
                  <span className="flex items-center gap-2">
                    Enable Shopping �
                    <span className="group-hover:translate-x-1 transition-transform">
                      →
                    </span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">
                    Just a one-time setup to hatch & feed
                  </span>
                </button>
              </div>
            )}

            <button
              onClick={() => buyFood()}
              disabled={isPending || allowance === BigInt(0)}
              className={`group flex flex-col items-center justify-center gap-3 p-6 rounded-3xl transition-all border-2 ${
                isPending || allowance === BigInt(0)
                  ? "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 opacity-40 cursor-not-allowed grayscale"
                  : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 active:scale-95"
              }`}
            >
              <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                🍎
              </div>
              <div className="text-center">
                <p className="font-black text-sm mb-0.5">Apple Treats</p>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  10 G$
                </p>
              </div>
            </button>

            <button
              onClick={() => revivePet()}
              disabled={health > 0 || isPending || allowance === BigInt(0)}
              className={`group flex flex-col items-center justify-center gap-3 p-6 rounded-3xl transition-all border-2 ${
                health > 0 || isPending || allowance === BigInt(0)
                  ? "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 opacity-40 cursor-not-allowed grayscale"
                  : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 active:scale-95"
              }`}
            >
              <div className="text-4xl group-hover:scale-110 transition-transform duration-300">
                💊
              </div>
              <div className="text-center">
                <p className="font-black text-sm mb-0.5">Wake Up Pet</p>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  50 G$
                </p>
              </div>
            </button>

            {/* Error Message Display */}
            {(writeError || receiptError) && (
              <div className="col-span-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 p-4 rounded-2xl flex items-start gap-3 text-red-600 dark:text-red-400">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div className="text-xs font-bold leading-relaxed">
                  <p className="mb-1 uppercase tracking-widest text-[10px]">
                    Transaction Failed
                  </p>
                  <p className="opacity-90">
                    {writeError?.message ||
                      receiptError?.message ||
                      "An unknown error occurred."}
                  </p>
                  <p className="mt-2 text-[10px] opacity-70">
                    Make sure you have enough CELO for gas!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {isPending && (
          <p className="mt-4 text-xs text-indigo-500 animate-pulse text-center">
            Transaction pending...
          </p>
        )}

        {/* Social Leaderboard */}
        <Leaderboard />
      </main>

      <NotificationToast
        isVisible={toast.isVisible}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        title={toast.title}
        message={toast.message}
        type={toast.type}
        showShare={toast.showShare}
        shareText={toast.shareText}
      />

      {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-100 flex items-center justify-center p-4 animate-in fade-in duration-300"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-3xl p-8 shadow-2xl border border-neutral-100 dark:border-neutral-800 relative transform transition-all animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
            >
              <X size={20} />
            </button>

            <div className="mb-8">
              <h3 className="text-2xl font-black mb-2 flex items-center gap-2">
                <User className="text-indigo-500" />
                Profile Settings
              </h3>
              <p className="text-neutral-500 text-sm">
                Give your journey a name! Choose a handle for yourself and name
                your pet.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 ml-1">
                  Your Handle
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">
                    @
                  </span>
                  <input
                    type="text"
                    value={tempUsername}
                    onChange={(e) =>
                      setTempUsername(
                        e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""),
                      )
                    }
                    placeholder="vitalik_fan"
                    className="w-full bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 pl-8 pr-4 font-bold outline-none transition-all dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2 ml-1">
                  Your Pet's Name
                </label>
                <input
                  type="text"
                  value={tempPetName}
                  onChange={(e) => setTempPetName(e.target.value)}
                  placeholder="Dino"
                  className="w-full bg-neutral-50 dark:bg-neutral-800 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 px-4 font-bold outline-none transition-all dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setNames(tempUsername, tempPetName);
                    setIsEditModalOpen(false);
                  }}
                  disabled={!tempUsername || !tempPetName || isPending}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                >
                  Save 🚀
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Loading Overlay */}
      {isProcessing && (
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
