"use client";
import { FocusTimer } from "@/components/FocusTimer";
import { PetView, PetStage, PetMood } from "@/components/PetView";
import { Leaderboard } from "@/components/Leaderboard";
import { useState, useEffect } from "react";
import { useFocusPet } from "@/hooks/useFocusPet";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { formatEther } from "viem";

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
    refetch,
    writeError,
    receiptError,
    isSigning,
    isProcessing,
    isLoadingPet,
  } = useFocusPet();

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
    if (!isPending && !isConfirming) {
      refetch();
    }
  }, [isConfirming, isPending, refetch]);

  // Parse BigInt data from contract
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pet = petData as any;
  // If pet is an array (Tuple from contract): [xp, health, lastInteraction, birthTime]
  // If it's undefined, default to 0/100
  const xp = pet ? Number(pet[0]) : 0;
  const health = pet ? Number(pet[1]) : 100;

  // Logic to calculate stage based on XP
  const getStage = (xp: number): PetStage => {
    if (xp < 100) return "egg";
    if (xp < 500) return "baby";
    if (xp < 2000) return "teen";
    if (xp < 5000) return "adult";
    return "elder";
  };

  const handleSessionComplete = (minutes: number) => {
    recordSession(minutes); // Record actual duration
    setMood("focused");
    setTimeout(() => setMood("happy"), 5000);
  };

  if (!isConnected) {
    return null; // Redirecting...
  }

  // Initial Loading State
  if (isLoadingPet) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center text-neutral-500">
        <div className="animate-spin text-4xl mb-4">🦅</div>
        <p className="animate-pulse">Loading FocusPet...</p>
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

        <div className="bg-neutral-100 dark:bg-neutral-900 p-6 rounded-2xl w-full max-w-sm">
          <h3 className="font-bold mb-4">Start by Focusing</h3>
          <FocusTimer onComplete={handleSessionComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="p-4 px-20 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900">
        <div className="flex items-center gap-2">
          <img
            src="/focus-pet-logo.jpeg"
            className="rounded-full h-10 w-10"
            alt=""
          />
          <h1 className="font-bold text-lg tracking-tight">FocusPet</h1>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <ConnectButton
            accountStatus="avatar"
            chainStatus="none"
            showBalance={false}
          />
        </div>
      </header>

      <main className="flex flex-col items-center pt-12 px-4 max-w-md mx-auto pb-20">
        <PetView stage={getStage(xp)} xp={xp} health={health} mood={mood} />

        {/* Timer Section */}
        <FocusTimer onComplete={handleSessionComplete} />

        {/* Pet Shop Section */}
        <div className="w-full mt-8 bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-100 dark:border-neutral-800">
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

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => approveG(BigInt("100000000000000000000"))} // Approve 100 G$
              className="col-span-2 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 py-2 rounded-lg text-sm font-medium hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors"
            >
              Authorization (Approve G$)
            </button>

            <button
              onClick={() => buyFood()}
              disabled={health >= 100 || isPending}
              className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">🍎</span>
              <span className="text-sm">Buy Food (-10)</span>
            </button>

            <button
              onClick={() => revivePet()}
              disabled={health > 0 || isPending} // Only revive if dead
              className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 py-3 rounded-xl font-bold flex flex-col items-center justify-center gap-1 hover:brightness-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="text-2xl">💊</span>
              <span className="text-sm">Revive (-50)</span>
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

        {/* Social Leaderboard */}
        <Leaderboard />
      </main>

      {/* Full Screen Loading Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white p-4">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <h2 className="text-2xl font-bold mb-2">Processing...</h2>
          <p className="text-neutral-300 text-center animate-pulse">
            {isSigning
              ? "Securing Reward Signature (Backend)..."
              : isPending
                ? "Please Confirm in Wallet..."
                : isConfirming
                  ? "Waiting for Transaction Confirmation..."
                  : "Finalizing..."}
          </p>
        </div>
      )}
    </div>
  );
}
