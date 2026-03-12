"use client";

import {
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { useWriteContracts, useCallsStatus } from "wagmi/experimental";
import { FocusPetABI } from "@/config/abi";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { CONTRACT_ADDRESS, GOOD_DOLLAR_ADDRESSES } from "@/config/contracts";
import { formatEther, erc20Abi } from "viem";

export function useFocusPet() {
  const { address } = useAccount();
  const [isSigning, setIsSigning] = useState(false);
  const [lastAction, setLastAction] = useState<
    "focus" | "shop" | "profile" | "sync" | null
  >(null);
  const [hasToasted, setHasToasted] = useState(false);
  const [pendingItem, setPendingItem] = useState<{
    id: string;
    price?: number;
  } | null>(null);
  const [pendingSession, setPendingSession] = useState<{
    minutes: number;
    multiplier: number;
  } | null>(null);

  const {
    writeContract,
    data: singleHash,
    isPending: isSinglePending,
    error: writeError,
  } = useWriteContract();

  const {
    writeContracts,
    data: batchId,
    isPending: isBatchPending,
    error: batchError,
  } = useWriteContracts();

  // MetaMask EOA Fallback: writeContracts returns a normal hash for single calls
  const batchIdStr = batchId as string | undefined;
  const isFallbackHash =
    typeof batchIdStr === "string" &&
    batchIdStr.startsWith("0x") &&
    batchIdStr.length === 66;
  const actualHash = isFallbackHash
    ? (batchIdStr as `0x${string}`)
    : singleHash;

  const { data: callsStatus } = useCallsStatus({
    id: isFallbackHash ? undefined : (batchIdStr as any)?.id || batchIdStr,
    query: {
      enabled: !!batchIdStr && !isFallbackHash,
      refetchInterval: (data) =>
        data.state.status === "pending" ? 1000 : false,
    },
  });

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: actualHash });

  const finalIsPending = isSinglePending || isBatchPending;
  const finalIsConfirming =
    isConfirming || (!isFallbackHash && callsStatus?.status === "pending");
  const finalIsConfirmed =
    isConfirmed || (!isFallbackHash && callsStatus?.status === "success");

  // Reset toast guard on new pending transaction
  useEffect(() => {
    if (finalIsPending || isSigning) {
      setHasToasted(false);
    }
  }, [finalIsPending, isSigning]);

  useEffect(() => {
    if (writeError) {
      console.error("Contract Write Error:", writeError);

      // Check for specific cryptic errors
      if (
        writeError.message?.includes("gasLimit") ||
        writeError.message?.includes("null")
      ) {
        console.warn(
          "Possible gas estimation failure. Ensure you have CELO for gas fees and that your pet is initialized.",
        );
      }

      if (writeError.message?.includes("insufficient funds")) {
        console.warn("Insufficient CELO for gas fees.");
      }
    }

    if (batchError) {
      console.error("Batch Error:", batchError);
      toast.error(
        `Transaction Failed\n${batchError.message || "Failed to batch transactions"}`,
      );
    }
  }, [writeError, receiptError, batchError]);

  // --- GoodDollar Integration ---
  const G_DOLLAR_ADDRESS = "0x62B8B11039FcfE5aB0C56E502b1C372A3d2a9c7A";

  const {
    data: multicallData,
    refetch: refetchAll,
    isLoading: isLoadingPet,
  } = useReadContracts({
    contracts: [
      {
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "pets",
        args: [address as `0x${string}`],
      },
      {
        address: G_DOLLAR_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      },
      {
        address: G_DOLLAR_ADDRESS,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address as `0x${string}`, CONTRACT_ADDRESS],
      },
      {
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "ownedCosmetics",
        args: [address as `0x${string}`, "sunglasses"],
      },
      {
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "ownedCosmetics",
        args: [address as `0x${string}`, "crown"],
      },
      {
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "isCosmeticEquipped",
        args: [address as `0x${string}`, "sunglasses"],
      },
      {
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "isCosmeticEquipped",
        args: [address as `0x${string}`, "crown"],
      },
      {
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "goodDollar",
      },
    ],
    query: {
      enabled: !!address,
      refetchInterval: 60000,
    },
  });

  // Extract from Multicall Array
  const petData = multicallData?.[0]?.result;
  const gBalance = multicallData?.[1]?.result;
  const allowance = multicallData?.[2]?.result;
  const isSunglassesOwned = multicallData?.[3]?.result;
  const isCrownOwned = multicallData?.[4]?.result;
  const isSunglassesEquipped = multicallData?.[5]?.result;
  const isCrownEquipped = multicallData?.[6]?.result;
  const goodDollarOnChain = multicallData?.[7]?.result;

  const refetch = refetchAll;
  const refetchGBalance = refetchAll;
  const refetchAllowance = refetchAll;

  // Handle Post-Confirmation Success Effects
  useEffect(() => {
    if (finalIsConfirmed && !hasToasted) {
      if (lastAction === "shop") {
        setHasToasted(true);
        toast.success("Purchase Successful!\nYour items are ready.");
        refetchAll();
      } else if (lastAction === "profile") {
        setHasToasted(true);
        toast.success("Profile Updated Successfully!");
        refetchAll();
      } else if (lastAction === "sync") {
        setHasToasted(true);
        toast.success(
          "Social Impact Synced!\nYour streamed G$ has been committed to the chain. 🌍✨",
        );
        refetchAll();
      }
    }
  }, [finalIsConfirmed, refetchAll, lastAction, hasToasted]);

  const approveG = (amount: bigint, itemId?: string, price?: number) => {
    // Check balance first
    const balance = gBalance ? (gBalance as bigint) : BigInt(0);
    if (balance < amount) {
      toast.error(
        `Insufficient G$ Balance\nYou need ${formatEther(amount)} G$ but only have ${formatEther(balance)} G$.`,
      );
      return;
    }

    setLastAction("shop");
    if (itemId) {
      setPendingItem({ id: itemId, price });
    }
    writeContract({
      address: G_DOLLAR_ADDRESS,
      abi: erc20Abi,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amount],
      gas: BigInt(100000),
    });
  };

  const executeBatchedBuy = (
    functionName: string,
    price: number,
    args: any[] = [],
  ) => {
    const amount = BigInt(price) * BigInt(10 ** 18);
    const balance = gBalance ? (gBalance as bigint) : BigInt(0);
    const currentAllowance = allowance ? (allowance as bigint) : BigInt(0);

    if (balance < amount) {
      toast.error(
        `Insufficient G$ Balance\nYou need ${price} G$ but only have ${formatEther(balance)} G$.`,
      );
      return;
    }

    setLastAction("shop");

    // EIP-5792: Batched Transactions (Approval + Buy in one click)
    const contractsToBatch = [];

    if (currentAllowance < amount) {
      contractsToBatch.push({
        address: G_DOLLAR_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, amount],
      });
    }

    contractsToBatch.push({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName,
      args,
    });

    writeContracts({
      contracts: contractsToBatch as any,
    });
  };

  const buyFood = () => executeBatchedBuy("buyFood", 10);
  const buySuperFood = () => executeBatchedBuy("buySuperFood", 30);
  const buyEnergyDrink = () => executeBatchedBuy("buyEnergyDrink", 25);
  const buyShield = () => executeBatchedBuy("buyShield", 100);
  const buyCosmetic = (id: string, price: number) =>
    executeBatchedBuy("buyCosmetic", price, [id, BigInt(price)]);

  const toggleCosmetic = (id: string) => {
    setLastAction("shop");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "toggleCosmetic",
      args: [id],
    });
  };

  const revivePet = () => executeBatchedBuy("revivePet", 50);

  const setNames = (username: string, petName: string) => {
    if (!hasPet) {
      alert("Hatch your pet first before setting names!");
      return;
    }
    setLastAction("profile");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "setNames",
      args: [username, petName],
      gas: BigInt(300000), // Manual gas limit to bypass estimation errors
    });
  };

  const recordSession = async (
    minutes: number,
    superchargeMultiplier: number = 1,
  ) => {
    setLastAction("focus");
    setPendingSession({ minutes, multiplier: superchargeMultiplier });

    try {
      setIsSigning(true);
      // Engagement rewards removed for simplicity/gas efficiency

      // Send Transaction
      writeContract(
        {
          address: CONTRACT_ADDRESS,
          abi: FocusPetABI,
          functionName: "focusSession",
          args: [BigInt(Math.max(1, Math.round(minutes * 60)))],
          gas: BigInt(500000), // Manual gas limit to bypass estimation errors
        },
        {
          onSettled: () => setIsSigning(false), // Stop signing state when wallet opens/fails
        },
      );
    } catch (e) {
      console.error("Session Record Error:", e);
      setIsSigning(false);
    }
  };

  // --- Automated Buy Logic (Sequential Transactions) ---
  useEffect(() => {
    if (isConfirmed && pendingItem && lastAction === "shop") {
      const executeBuy = async () => {
        const item = pendingItem;
        setPendingItem(null); // Clear first to prevent loops

        // Allow some time for the RPC to catch up with the allowance change
        await refetchAllowance();
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2s safety buffer for RPC sync

        console.log("🚀 Auto-triggering buy for:", item.id);

        if (item.id === "apple") buyFood();
        else if (item.id === "golden_apple") buySuperFood();
        else if (item.id === "energy_drink") buyEnergyDrink();
        else if (item.id === "shield") buyShield();
        else if (item.id === "revive") revivePet();
        else if (item.price) buyCosmetic(item.id, item.price);
      };

      executeBuy();
    }
  }, [isConfirmed, pendingItem, lastAction]);

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
  const boostEndTime = pet && pet[8] ? Number(pet[8]) : 0;
  const shieldCount = pet && pet[9] ? Number(pet[9]) : 0;
  const activeCosmetic = pet && pet[10] ? (pet[10] as string) : "";
  const totalDonated = pet && pet[11] ? BigInt(pet[11]) : BigInt(0);
  const rawTotalTime = pet && pet[12] ? Number(pet[12]) : 0;

  // --- Virtual Health Decay (Real-time calculation) ---
  const [health, setHealth] = useState(rawHealth);
  const [xp, setXp] = useState(rawXp);
  const [totalTime, setTotalTime] = useState(rawTotalTime);

  // --- Streak Bonus Calculation ---
  const [virtualStreak, setVirtualStreak] = useState(streak);

  useEffect(() => {
    if (lastDailySession > 0) {
      const calculateVirtualStreak = () => {
        const now = Math.floor(Date.now() / 1000);
        const lastSessionDay = Math.floor(lastDailySession / (24 * 60 * 60));
        const currentDay = Math.floor(now / (24 * 60 * 60));

        if (currentDay > lastSessionDay + 1) {
          // Missed more than a day - check if we have a shield to protect it
          if (shieldCount > 0) {
            setVirtualStreak(streak);
          } else {
            setVirtualStreak(0);
          }
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
  const [isNight, setIsNight] = useState<boolean>(false);

  useEffect(() => {
    const calculateWeather = () => {
      if (!lastDailySession) return setWeather("clear");

      const now = Math.floor(Date.now() / 1000);
      const diffHrs = (now - lastDailySession) / 3600;
      const recentInteractionHrs = (now - lastInteraction) / 3600;

      if (diffHrs < 24 || recentInteractionHrs < 24) {
        // If they just focused (last 1 hour), make it Sunny!
        if (recentInteractionHrs < 1) {
          setWeather("sunny");
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
    const checkTime = () => {
      const hours = new Date().getHours();
      setIsNight(hours >= 20 || hours < 6);
    };
    checkTime();

    const interval = setInterval(() => {
      calculateWeather();
      checkTime();
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lastDailySession, streak, lastInteraction]);

  // Handle Focus Session Specific Confirmed Success Effects (Requires Pet Context Variables)
  useEffect(() => {
    if (
      finalIsConfirmed &&
      !hasToasted &&
      lastAction === "focus" &&
      pendingSession
    ) {
      setHasToasted(true);

      const { minutes, multiplier } = pendingSession;
      const seconds = Math.round(minutes * 60);
      const isBoostActive = boostEndTime > Math.floor(Date.now() / 1000);
      const nightMultiplier = isNight ? 1.1 : 1.0;
      const totalMultiplier =
        multiplier * (isBoostActive ? 2 : 1) * nightMultiplier;

      const baseXP = seconds + Math.floor((seconds * streakBonus) / 100);
      const finalXP = Math.floor(baseXP * totalMultiplier);

      setXp((prev) => prev + finalXP);
      setTotalTime((prev) => prev + seconds);
      setHealth((prev) => Math.min(100, prev + 5));

      toast.success(
        `Session Recorded! 🏆\nYour pet gained ${finalXP.toLocaleString()} XP! ${isNight ? "🦉 Night Owl Bonus applied! " : ""}(Multipliers applied: ${totalMultiplier.toFixed(1)}x) ⚡️`,
      );
      setPendingSession(null);
      refetchAll();
    }
  }, [
    finalIsConfirmed,
    hasToasted,
    lastAction,
    pendingSession,
    boostEndTime,
    isNight,
    streakBonus,
    refetchAll,
  ]);

  useEffect(() => {
    if (
      goodDollarOnChain &&
      (goodDollarOnChain as string) ===
        "0x0000000000000000000000000000000000000000"
    ) {
      console.error(
        "🚨 FocusPet Contract is UNINITIALIZED! Please call initialize() on Remix.",
      );
      toast.error(
        "Contract Error\nFocusPet contract is not initialized. Please contact admin.",
      );
    }
  }, [goodDollarOnChain]);

  useEffect(() => {
    setHealth(rawHealth);
    setXp(rawXp);
    setTotalTime(rawTotalTime);

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

  // Write: Sync Impact
  const { writeContract: writeSyncImpact, isPending: isSyncImpactLoading } =
    useWriteContract();

  const handleSyncImpact = async () => {
    setLastAction("sync");
    try {
      writeSyncImpact(
        {
          address: CONTRACT_ADDRESS,
          abi: FocusPetABI,
          functionName: "syncImpact",
        },
        {
          onError: (error) => {
            console.error("Sync impact failed:", error);
            toast.error("Sync failed\nPlease try again later.");
          },
        },
      );
    } catch (error) {
      console.error("Sync catch block hit:", error);
    }
  };

  return {
    petData,
    hasPet,
    isPending: finalIsPending,
    isConfirming: finalIsConfirming,
    isConfirmed: finalIsConfirmed,
    hash: actualHash,
    writeError,
    receiptError,
    refetch,
    // Actions
    recordSession,
    buyFood,
    buySuperFood,
    buyEnergyDrink,
    buyShield,
    buyCosmetic,
    revivePet,
    setNames,
    // Economy
    gBalance,
    approveG,
    refetchGBalance,
    // UX
    isSigning,
    isProcessing: isSigning || finalIsPending || finalIsConfirming,
    isLoadingPet,
    xp,
    totalTime,
    health,
    username,
    petName,
    lastAction,
    allowance: allowance ? (allowance as bigint) : BigInt(0),
    refetchAllowance,
    streak: virtualStreak,
    streakBonus,
    weather,
    // Boosts & Cosmetics
    boostEndTime,
    shieldCount,
    activeCosmetic, // Keep for compatibility if needed
    equippedCosmetics: {
      sunglasses: !!isSunglassesEquipped,
      crown: !!isCrownEquipped,
    },
    toggleCosmetic,
    inventory: {
      sunglasses: !!isSunglassesOwned,
      crown: !!isCrownOwned,
    },
    writeSyncImpact,
    handleSyncImpact,
    isSyncImpactLoading,
    totalDonated,
    isNight,
  };
}
