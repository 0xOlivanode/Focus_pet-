"use client";
import { FocusTimer } from "@/components/FocusTimer";
import { PetView, PetStage, PetMood } from "@/components/PetView";
import { Leaderboard } from "@/components/Leaderboard";
import { Coins, Sparkles } from "lucide-react"; // Added Sparkles
import { useState, useEffect } from "react";
import { useFocusPet } from "@/hooks/useFocusPet";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

import { formatEther } from "viem";

export default function Home() {
  const { isConnected } = useAccount();
  const {
    petData,
    hasPet,
    mintPet,
    recordSession,
    gBalance,
    approveG,
    buyFood,
    revivePet,
    isPending,
    isConfirming,
    refetch,
    refetchBalance,
  } = useFocusPet();

  // Local state for UI responsiveness while tx confirms
  const [mood, setMood] = useState<PetMood>("happy");

  useEffect(() => {
    if (isConfirming) {
      // optimistically show loading or wait
    }
    if (!isPending && !isConfirming) {
      refetch();
      refetchBalance();
    }
  }, [isConfirming, isPending, refetch, refetchBalance]);

  // Parse BigInt data from contract
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pet = petData as any;
  const xp = pet ? Number(pet.xp) : 0;
  const health = pet ? Number(pet.health) : 100;

  // Logic to calculate stage based on XP
  const getStage = (xp: number): PetStage => {
    if (xp < 100) return "egg";
    if (xp < 500) return "baby";
    if (xp < 2000) return "teen";
    if (xp < 5000) return "adult";
    return "elder";
  };

  const handleSessionComplete = () => {
    recordSession(25); // Record 25 mins
    setMood("focused");
    setTimeout(() => setMood("happy"), 5000);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-6">FocusPet 🦅</h1>
        <p className="text-neutral-500 mb-8 text-center max-w-sm">
          Connect your wallet to start raising your focus companion.
        </p>
        <ConnectButton />
      </div>
    );
  }

  if (!hasPet) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex flex-col items-center justify-center p-4 text-center">
        <div className="text-9xl mb-8 animate-bounce">🥚</div>
        <h1 className="text-2xl font-bold mb-2">Adopt Your Pet</h1>
        <p className="text-neutral-500 mb-8">
          Mint your FocusPet NFT to begin your journey.
        </p>

        <button
          onClick={() => mintPet()}
          disabled={isPending || isConfirming}
          className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold text-lg shadow-xl shadow-indigo-500/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending
            ? "Confirming..."
            : isConfirming
              ? "Minting..."
              : "Mint Pet"}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-900">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🦅</span>
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

        {/* Social Leaderboard */}
        <Leaderboard />
      </main>
    </div>
  );
}
