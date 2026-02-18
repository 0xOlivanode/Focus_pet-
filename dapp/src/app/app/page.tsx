"use client";
import { FocusTimer } from "@/components/FocusTimer";
import { PetView } from "@/components/PetView";
import { PetStage, PetMood, getPetStage } from "@/utils/pet";
import { Leaderboard } from "@/components/Leaderboard";
import { useState, useEffect } from "react";
import { useFocusPet } from "@/hooks/useFocusPet";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { formatEther } from "viem";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SocialShare } from "@/components/SocialShare";
import { User, Edit2, X, HelpCircle } from "lucide-react";
import confetti from "canvas-confetti";
import { OnboardingModal } from "@/components/OnboardingModal";

const TIMERS = {
  FOCUS: 25 * 60,
  SHORT: 5 * 60,
  LONG: 15 * 60,
};

export default function AppPage() {
  const { isConnected } = useAccount();
  const router = useRouter();

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
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="text-9xl mb-8 animate-bounce">🥚</div>
        <h1 className="text-2xl font-bold mb-2">Welcome to FocusPet</h1>
        <p className="text-neutral-500 mb-8 max-w-sm">
          Your pet is tied to your account. Complete your first focus session or
          buy food to hatch your egg!
        </p>

        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button
            onClick={() => setShowOnboarding(true)}
            className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 py-3 rounded-xl font-bold border border-indigo-100 dark:border-indigo-800 transition-all hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center justify-center gap-2"
          >
            <HelpCircle size={18} />
            See How it Works
          </button>

          <div className="bg-neutral-100 dark:bg-neutral-900 p-6 rounded-2xl">
            <h3 className="font-bold mb-4">Start by Focusing</h3>
            <FocusTimer onComplete={handleSessionComplete} />
          </div>
        </div>

        {showOnboarding && <OnboardingModal onClose={handleCloseOnboarding} />}

        {/* Loading Overlay for first session */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center text-white p-4">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse rounded-full" />
              <div className="text-8xl mb-8 animate-bounce relative z-10">
                🐣
              </div>
            </div>
            <h2 className="text-3xl font-black mb-3 tracking-tight">
              Hatching Your Pet...
            </h2>
            <p className="text-neutral-400 text-center max-w-xs leading-relaxed">
              {isSigning
                ? "Securing your focus reward on-chain..."
                : isPending
                  ? "Please confirm the transaction in your wallet..."
                  : isConfirming
                    ? "Waking up your new friend... almost there!"
                    : "Finalizing your pet's birth..."}
            </p>
            <div className="mt-12 flex gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
            </div>
          </div>
        )}
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
          <p className="text-neutral-500 font-medium flex items-center justify-center gap-1">
            Raised by{" "}
            <span className="text-indigo-500 font-bold">
              @{username || "focuser"}
            </span>
          </p>
        </div>

        <PetView stage={stage} xp={xp} health={health} mood={mood} />

        {/* Timer Section */}
        <FocusTimer
          onComplete={handleSessionComplete}
          onStart={() => setMood("focused")}
          onPause={() => setMood("sleeping")}
        />

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
                  onClick={() => approveG(BigInt("100000000000000000000"))} // Approve 100 G$
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
              disabled={health >= 100 || isPending || allowance === BigInt(0)}
              className={`group flex flex-col items-center justify-center gap-3 p-6 rounded-3xl transition-all border-2 ${
                allowance === BigInt(0)
                  ? "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 opacity-60 cursor-not-allowed"
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
                allowance === BigInt(0)
                  ? "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 opacity-60 cursor-not-allowed"
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
          </div>
        </div>

        {isPending && (
          <p className="mt-4 text-xs text-indigo-500 animate-pulse">
            Transaction pending...
          </p>
        )}

        {(writeError || receiptError) && (
          <p className="mt-4 text-xs text-red-500 max-w-xs wrap-break-word">
            Error: {(writeError || receiptError)?.message}
          </p>
        )}

        {/* Success Message for Focus Session */}
        {isConfirmed && lastAction === "focus" && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-center animate-fade-in border border-green-200 dark:border-green-800 w-full">
            <p className="font-bold text-lg">Session Recorded! 🎉</p>
            <p className="text-sm mb-3">Your pet is growing stronger.</p>
            <div className="flex justify-center">
              <SocialShare
                text={`I just focused for 25 minutes with FocusPet! 🦅 My pet is leveling up on Celo. #FocusPet #BuildWithCelo`}
                url="https://focus-pet.vercel.app"
              />
            </div>
          </div>
        )}

        {/* Feedback for Shop Actions */}
        {isConfirmed && lastAction === "shop" && (
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-center animate-fade-in border border-indigo-200 dark:border-indigo-800 w-full text-sm font-medium">
            Shop updated! 🛍️ Check your treats or balance.
          </div>
        )}

        {/* Feedback for Profile Updates */}
        {isConfirmed && lastAction === "profile" && (
          <div className="mt-4 p-3 bg-neutral-50 dark:bg-neutral-900/40 text-neutral-700 dark:text-neutral-300 rounded-lg text-center animate-fade-in border border-neutral-200 dark:border-neutral-800 w-full text-sm font-medium">
            Identity updated on-chain! 👤
          </div>
        )}

        {/* Social Leaderboard */}
        <Leaderboard />
      </main>

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
