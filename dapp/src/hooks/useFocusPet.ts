"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { useEffect, useState } from "react";

import { CONTRACT_ADDRESS, GOOD_DOLLAR_ADDRESSES } from "@/config/contracts";

export function useFocusPet() {
  const { address } = useAccount();
  const [isSigning, setIsSigning] = useState(false);
  const [lastAction, setLastAction] = useState<
    "focus" | "shop" | "profile" | null
  >(null);

  const {
    writeContract,
    data: hash,
    isPending,
    error: writeError,
  } = useWriteContract();
  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash });

  useEffect(() => {
    if (writeError) {
      console.error("Minting Write Error:", writeError);
    }
    if (receiptError) {
      console.error("Minting Receipt Error:", receiptError);
    }
  }, [writeError, receiptError]);

  // Read Pet Data by Address
  const {
    data: petData,
    refetch,
    isLoading: isLoadingPet,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FocusPetABI,
    functionName: "pets",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 60000, // Background refetch every 60s
    },
  });

  // --- GoodDollar Integration ---
  const G_DOLLAR_ADDRESS = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A";
  const ERC20ABI = [
    {
      inputs: [{ name: "owner", type: "address" }],
      name: "balanceOf",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
    {
      inputs: [
        { name: "spender", type: "address" },
        { name: "value", type: "uint256" },
      ],
      name: "approve",
      outputs: [{ name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [
        { name: "owner", type: "address" },
        { name: "spender", type: "address" },
      ],
      name: "allowance",
      outputs: [{ name: "", type: "uint256" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  const { data: gBalance, refetch: refetchGBalance } = useReadContract({
    address: G_DOLLAR_ADDRESS,
    abi: ERC20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: G_DOLLAR_ADDRESS,
    abi: ERC20ABI,
    functionName: "allowance",
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    query: { enabled: !!address },
  });

  const approveG = (amount: bigint) => {
    setLastAction("shop");
    writeContract({
      address: G_DOLLAR_ADDRESS,
      abi: ERC20ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amount],
    });
  };

  const buyFood = () => {
    setLastAction("shop");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "buyFood",
      args: [],
    });
  };

  const revivePet = () => {
    setLastAction("shop");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "revivePet",
      args: [],
    });
  };

  const setNames = (username: string, petName: string) => {
    setLastAction("profile");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "setNames",
      args: [username, petName],
    });
  };

  const recordSession = async (minutes: number) => {
    setLastAction("focus");
    try {
      setIsSigning(true);
      // 1. Get Signature from Backend
      const response = await fetch("/api/sign-reward", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userAddress: address,
          minutes,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to sign");

      const { signature, validUntilBlock, inviter } = data;

      // 2. Send Transaction
      writeContract(
        {
          address: CONTRACT_ADDRESS,
          abi: FocusPetABI,
          functionName: "focusSession",
          args: [
            BigInt(Math.max(1, Math.round(minutes))),
            inviter,
            BigInt(validUntilBlock),
            signature,
          ],
        },
        {
          onSuccess: () => {
            // Optimistic UI Update: Update local state immediately before chain syncs
            const bonusValue = Math.floor((minutes * streakBonus) / 100);
            setXp((prev) => prev + minutes + bonusValue);
            setHealth((prev) => Math.min(100, prev + 5));
          },
          onSettled: () => setIsSigning(false), // Stop signing state when wallet opens/fails
        },
      );
    } catch (e) {
      console.error("Session Record Error:", e);
      alert("Failed to secure reward signature!");
      setIsSigning(false);
    }
  };

  // Helper to determine if user has a pet (birthTime > 0)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pet = petData as any;
  const rawXp = pet ? Number(pet[0]) : 0;
  const rawHealth = pet ? Number(pet[1]) : 100;
  const lastInteraction = pet ? Number(pet[2]) : 0;
  const hasPet = pet && Number(pet[3]) > 0; // birthTime is index 3
  const username = pet ? (pet[4] as string) : "";
  const petName = pet ? (pet[5] as string) : "Unnamed Pet";
  const streak = pet && pet[6] ? Number(pet[6]) : 0;
  const lastDailySession = pet && pet[7] ? Number(pet[7]) : 0;

  // --- Virtual Health Decay (Real-time calculation) ---
  const [health, setHealth] = useState(rawHealth);
  const [xp, setXp] = useState(rawXp);

  // --- Streak Bonus Calculation ---
  const [virtualStreak, setVirtualStreak] = useState(streak);

  useEffect(() => {
    if (lastDailySession > 0) {
      const calculateVirtualStreak = () => {
        const now = Math.floor(Date.now() / 1000);
        const lastSessionDay = Math.floor(lastDailySession / (24 * 60 * 60));
        const currentDay = Math.floor(now / (24 * 60 * 60));

        if (currentDay > lastSessionDay + 1) {
          // Missed more than a day
          setVirtualStreak(0);
        } else {
          setVirtualStreak(streak);
        }
      };

      calculateVirtualStreak();
      const interval = setInterval(calculateVirtualStreak, 60000); // Check every minute
      return () => clearInterval(interval);
    } else {
      setVirtualStreak(streak);
    }
  }, [streak, lastDailySession]);

  const streakBonus = Math.min(
    20,
    (virtualStreak > 1 ? virtualStreak - 1 : 0) * 5,
  ); // 5% per day, max 20%

  // --- Dynamic Weather Calculation ---
  const [weather, setWeather] = useState<
    "sunny" | "clear" | "cloudy" | "rainy" | "stormy"
  >("clear");

  useEffect(() => {
    const calculateWeather = () => {
      if (!lastDailySession) return setWeather("clear");

      const now = Math.floor(Date.now() / 1000);
      const diffHrs = (now - lastDailySession) / 3600;
      const recentInteractionHrs = (now - lastInteraction) / 3600;

      if (diffHrs < 24 || recentInteractionHrs < 24) {
        // If they just focused (last 1 hour), make it Sunny!
        if (recentInteractionHrs < 1) {
          setWeather("stormy");
        } else {
          setWeather(streak > 1 ? "sunny" : "clear");
        }
      } else if (diffHrs < 48) {
        setWeather("cloudy");
      } else if (diffHrs < 72) {
        setWeather("rainy");
      } else {
        setWeather("stormy");
      }
    };

    calculateWeather();
    const interval = setInterval(calculateWeather, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lastDailySession, streak]);

  useEffect(() => {
    setHealth(rawHealth);
    setXp(rawXp);

    if (hasPet && lastInteraction > 0 && rawHealth > 0) {
      const calculateVirtualHealth = () => {
        const now = Math.floor(Date.now() / 1000);
        const timeDiff = now - lastInteraction;
        const daysPassed = timeDiff / (24 * 60 * 60);
        const healthLoss = Math.floor(daysPassed * 10); // DECAY_RATE_PER_DAY = 10

        if (healthLoss > 0) {
          const virtualHealth = Math.max(0, rawHealth - healthLoss);
          setHealth(virtualHealth);
        }
      };

      calculateVirtualHealth();
      // Tick every minute to update decay if needed
      const interval = setInterval(calculateVirtualHealth, 60000);
      return () => clearInterval(interval);
    }
  }, [rawHealth, rawXp, lastInteraction, hasPet]);

  return {
    petData,
    hasPet,
    isPending,
    isConfirming,
    isConfirmed,
    hash,
    writeError,
    receiptError,
    refetch,
    // Actions
    recordSession,
    buyFood,
    revivePet,
    setNames,
    // Economy
    gBalance,
    approveG,
    refetchGBalance,
    // UX
    isSigning,
    isProcessing: isSigning || isPending || isConfirming,
    isLoadingPet,
    xp,
    health,
    username,
    petName,
    lastAction,
    allowance: allowance ? (allowance as bigint) : BigInt(0),
    refetchAllowance,
    streak: virtualStreak,
    streakBonus,
    weather,
  };
}
