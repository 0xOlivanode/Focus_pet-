"use client";

import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useAccount,
} from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CONTRACT_ADDRESS, GOOD_DOLLAR_ADDRESSES } from "@/config/contracts";
import { formatEther } from "viem";

export function useFocusPet() {
  const { address } = useAccount();
  const [isSigning, setIsSigning] = useState(false);
  const [lastAction, setLastAction] = useState<
    "focus" | "shop" | "profile" | null
  >(null);
  const [pendingItem, setPendingItem] = useState<{
    id: string;
    price?: number;
  } | null>(null);

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
    if (receiptError) {
      console.error("Contract Receipt Error:", receiptError);
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

  const approveG = (amount: bigint, itemId?: string, price?: number) => {
    // Check balance first
    const balance = gBalance ? (gBalance as bigint) : BigInt(0);
    if (balance < amount) {
      toast.error("Insufficient G$ Balance", {
        description: `You need ${formatEther(amount)} G$ but only have ${formatEther(balance)} G$.`,
      });
      return;
    }

    setLastAction("shop");
    if (itemId) {
      setPendingItem({ id: itemId, price });
    }
    writeContract({
      address: G_DOLLAR_ADDRESS,
      abi: ERC20ABI,
      functionName: "approve",
      args: [CONTRACT_ADDRESS, amount],
      gas: BigInt(100000),
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

  const buySuperFood = () => {
    setLastAction("shop");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "buySuperFood",
      args: [],
    });
  };

  const buyEnergyDrink = () => {
    setLastAction("shop");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "buyEnergyDrink",
      args: [],
    });
  };

  const buyShield = () => {
    setLastAction("shop");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "buyShield",
      args: [],
    });
  };

  const buyCosmetic = (id: string, price: number) => {
    const amount = BigInt(price) * BigInt(10 ** 18);
    const balance = gBalance ? (gBalance as bigint) : BigInt(0);
    if (balance < amount) {
      toast.error("Insufficient G$ Balance");
      return;
    }

    setLastAction("shop");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "buyCosmetic",
      args: [id, BigInt(price)],
    });
  };

  const toggleCosmetic = (id: string) => {
    setLastAction("shop");
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "toggleCosmetic",
      args: [id],
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
          onSuccess: () => {
            const seconds = Math.round(minutes * 60);
            // Dynamic Multiplier Calculation
            const isBoostActive = boostEndTime > Math.floor(Date.now() / 1000);
            const totalMultiplier =
              superchargeMultiplier * (isBoostActive ? 2 : 1);

            const baseXP = seconds + Math.floor((seconds * streakBonus) / 100);
            const finalXP = Math.floor(baseXP * totalMultiplier);

            setXp((prev) => prev + finalXP);
            setTotalTime((prev) => prev + seconds);
            setHealth((prev) => Math.min(100, prev + 5));

            toast.success("Session Recorded! 🏆", {
              description: `Your pet gained ${finalXP.toLocaleString()} XP! (Multipliers applied: ${totalMultiplier.toFixed(1)}x) ⚡️`,
            });
          },
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

  // Ownership Tracking
  const { data: isSunglassesOwned } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FocusPetABI,
    functionName: "ownedCosmetics",
    args: address ? [address, "sunglasses"] : undefined,
    query: { enabled: !!address },
  });

  const { data: isCrownOwned } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FocusPetABI,
    functionName: "ownedCosmetics",
    args: address ? [address, "crown"] : undefined,
    query: { enabled: !!address },
  });

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
    const interval = setInterval(calculateWeather, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lastDailySession, streak]);

  // --- Initialization Diagnostics ---
  const { data: goodDollarOnChain } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: FocusPetABI,
    functionName: "goodDollar",
  });

  useEffect(() => {
    if (
      goodDollarOnChain &&
      (goodDollarOnChain as string) ===
        "0x0000000000000000000000000000000000000000"
    ) {
      console.error(
        "🚨 FocusPet Contract is UNINITIALIZED! Please call initialize() on Remix.",
      );
      toast.error("Contract Error", {
        description:
          "FocusPet contract is not initialized. Please contact admin.",
      });
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
    try {
      writeSyncImpact({
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "syncImpact",
      });
      toast.success("Social Impact Synced!", {
        description: "Your streamed G$ has been committed to the chain. 🌍✨",
      });
    } catch (error) {
      console.error("Sync impact failed:", error);
      toast.error("Sync failed", {
        description: "Please try again later.",
      });
    }
  };

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
    isProcessing: isSigning || isPending || isConfirming,
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
    activeCosmetic,
    toggleCosmetic,
    inventory: {
      sunglasses: !!isSunglassesOwned,
      crown: !!isCrownOwned,
    },
    writeSyncImpact,
    handleSyncImpact,
    isSyncImpactLoading,
    totalDonated,
  };
}
