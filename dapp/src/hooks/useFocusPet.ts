"use client";

import {
  useReadContracts,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useUnifiedWriteContract } from "@/hooks/useUnifiedWriteContract";
import { FocusPetABI } from "@/config/abi";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { CONTRACT_ADDRESS, GOOD_DOLLAR_ADDRESSES } from "@/config/contracts";

const G_DOLLAR_ADDRESS = GOOD_DOLLAR_ADDRESSES.CELO_MAINNET;
const USDT_ADDRESS = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";

// USDT price constants (6 decimals, matching contract)
const PRICE_FOOD_USDT = BigInt(100_000);
const PRICE_SUPER_FOOD_USDT = BigInt(250_000);
const PRICE_ENERGY_DRINK_USDT = BigInt(200_000);
const PRICE_SHIELD_USDT = BigInt(500_000);
const PRICE_REVIVE_USDT = BigInt(250_000);
import { formatEther, erc20Abi } from "viem";
import { useAuth } from "@/hooks/useAuth";

export function useFocusPet() {
  // Use useAuth so the address is available as soon as Web3Auth connects,
  // without waiting for the wagmi bridge to complete. useAuth falls back to
  // the Web3Auth EIP1193 provider address when wagmiAddress is not yet set.
  const { address } = useAuth();

  const txOverrides = {};

  const [isSigning, setIsSigning] = useState(false);
  const [lastAction, setLastAction] = useState<
    "focus" | "shop" | "profile" | "sync" | null
  >(null);
  const [hasToasted, setHasToasted] = useState(false);
  const [pendingItem, setPendingItem] = useState<{
    id: string;
    price?: number;
    functionName?: string;
    args?: any[];
  } | null>(null);
  const [pendingSession, setPendingSession] = useState<{
    minutes: number;
    multiplier: number;
  } | null>(null);

  const {
    writeContract,
    writeContractAsync,
    data: singleHash,
    isPending: isSinglePending,
    error: writeError,
  } = useUnifiedWriteContract();

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: receiptError,
  } = useWaitForTransactionReceipt({ hash: singleHash });

  const finalIsPending = isSinglePending;
  const finalIsConfirming = isConfirming;
  const finalIsConfirmed = isConfirmed;

  // Reset toast guard on new pending transaction
  useEffect(() => {
    if (finalIsPending || isSigning) {
      setHasToasted(false);
    }
  }, [finalIsPending, isSigning]);

  useEffect(() => {
    if (writeError) {
      console.error("Contract Write Error:", writeError);
      const name = (writeError as any)?.name ?? "";
      const code = (writeError as any)?.code ?? 0;
      if (name === "EstimateGasExecutionError" || code === -32000) {
        toast.error("Transaction failed — insufficient gas or contract error.");
      } else if (name === "InsufficientFundsError" || code === -32603) {
        toast.error("Insufficient funds for network fee.");
      } else if (name === "UserRejectedRequestError" || code === 4001) {
        // user cancelled — no toast
      } else {
        toast.error("Transaction failed — please try again.");
      }
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError) {
      console.error("Receipt Error (tx reverted):", receiptError);
      toast.error("Transaction reverted on-chain — please try again.");
    }
  }, [receiptError]);

  // --- GoodDollar Integration ---

  const {
    data: multicallData,
    refetch: refetchAll,
    isLoading: isLoadingPet,
    isError: isPetLoadError,
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
      {
        address: USDT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      },
      {
        address: USDT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address as `0x${string}`, CONTRACT_ADDRESS],
      },
    ],
    query: {
      enabled: !!address,
      refetchInterval: 60000,
      retry: 2,
      retryDelay: 2000,
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
  const usdtBalanceRaw = multicallData?.[8]?.result ? (multicallData[8].result as bigint) : BigInt(0);
  const usdtAllowanceRaw = multicallData?.[9]?.result ? (multicallData[9].result as bigint) : BigInt(0);

  const refetch = refetchAll;
  const refetchGBalance = refetchAll;
  const refetchAllowance = refetchAll;

  // Handle Post-Confirmation Success Effects
  useEffect(() => {
    if (finalIsConfirmed && !hasToasted) {
      if (lastAction === "focus") {
        setHasToasted(true);
        refetchAll();
      } else if (lastAction === "shop") {
        if (!pendingItem) {
          setHasToasted(true);
          toast.success("Purchase Successful!\nYour items are ready.");
          refetchAll();
        }
      } else if (lastAction === "profile") {
        setHasToasted(true);
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
      ...txOverrides,
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
    itemId?: string,
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

    if (currentAllowance < amount) {
      if (itemId) {
        setPendingItem({ id: itemId, price, functionName, args });
      }
      writeContract({
        ...txOverrides,
        address: G_DOLLAR_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, amount],
        gas: BigInt(100_000),
      } as any);
    } else {
      writeContract({
        ...txOverrides,
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: functionName as any,
        args: args as any,
        gas: BigInt(400_000),
      } as any);
    }
  };

  const buyFood = () => executeBatchedBuy("buyFood", 10, [], "apple");
  const buySuperFood = () =>
    executeBatchedBuy("buySuperFood", 30, [], "golden_apple");
  const buyEnergyDrink = () =>
    executeBatchedBuy("buyEnergyDrink", 25, [], "energy_drink");
  const buyShield = () => executeBatchedBuy("buyShield", 100, [], "shield");
  const buyCosmetic = (id: string, price: number) =>
    executeBatchedBuy("buyCosmetic", price, [id, BigInt(price)], id);

  // ── USDT buy functions (for MiniPay) ──────────────────────────────────────
  const executeUSDTBuy = (
    functionName: string,
    usdtAmount: bigint,
    args: any[] = [],
    itemId?: string,
  ) => {
    if (usdtBalanceRaw < usdtAmount) {
      toast.error("Insufficient USDT balance");
      return;
    }
    setLastAction("shop");
    if (usdtAllowanceRaw < usdtAmount) {
      if (itemId) setPendingItem({ id: itemId, functionName, args });
      writeContract({
        address: USDT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, usdtAmount],
        gas: BigInt(100_000),
      } as any);
    } else {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: functionName as any,
        args: args as any,
        gas: BigInt(400_000),
      } as any);
    }
  };

  const buyFoodWithUSDT = () =>
    executeUSDTBuy("buyFoodWithUSDT", PRICE_FOOD_USDT, [], "apple");
  const buySuperFoodWithUSDT = () =>
    executeUSDTBuy("buySuperFoodWithUSDT", PRICE_SUPER_FOOD_USDT, [], "golden_apple");
  const buyEnergyDrinkWithUSDT = () =>
    executeUSDTBuy("buyEnergyDrinkWithUSDT", PRICE_ENERGY_DRINK_USDT, [], "energy_drink");
  const buyShieldWithUSDT = () =>
    executeUSDTBuy("buyShieldWithUSDT", PRICE_SHIELD_USDT, [], "shield");
  const revivePetWithUSDT = () =>
    executeUSDTBuy("revivePetWithUSDT", PRICE_REVIVE_USDT, [], "revive");
  const buyCosmeticWithUSDT = (cosmeticId: string, usdtPrice: bigint) =>
    executeUSDTBuy("buyCosmeticWithUSDT", usdtPrice, [cosmeticId, usdtPrice], cosmeticId);

  const toggleCosmetic = (id: string) => {
    setLastAction("shop");
    writeContract({
      ...txOverrides,
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "toggleCosmetic",
      args: [id],
      gas: BigInt(100_000),
    });
  };

  const revivePet = () => executeBatchedBuy("revivePet", 50);

  const setNames = (username: string, petName: string) => {
    if (!hasPet) {
      toast.error("Hatch your pet first before setting names!");
      return;
    }
    setLastAction("profile");
    writeContract({
      ...txOverrides,
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "setNames",
      args: [username, petName],
      gas: BigInt(200_000),
    });
  };

  const deleteUser = () => {
    setLastAction("profile");
    writeContract({
      ...txOverrides,
      address: CONTRACT_ADDRESS,
      abi: FocusPetABI,
      functionName: "deleteUser",
      gas: BigInt(200_000),
    });
  };

  const recordSession = async (
    minutes: number,
    superchargeMultiplier: number = 1,
  ) => {
    setLastAction("focus");
    setPendingSession({ minutes, multiplier: superchargeMultiplier });
    toast.dismiss("session-retry");

    // Persist before attempting so the user can retry if the tx fails
    // (e.g. provider went stale after a long session, network blip, etc.)
    try {
      localStorage.setItem(
        "pending-focus-session",
        JSON.stringify({ minutes, multiplier: superchargeMultiplier, timestamp: Date.now() }),
      );
    } catch {}

    try {
      setIsSigning(true);
      await writeContractAsync({
        ...txOverrides,
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "focusSession",
        args: [BigInt(Math.max(1, Math.round(minutes * 60)))],
        // Hard gas limit — skips eth_estimateGas. 600k covers first-time pet
        // init (_initPet writes ~13 cold storage slots ≈ 260k gas) + session logic.
        gas: BigInt(600_000),
      });
      // Clear the pending session on successful submission
      try { localStorage.removeItem("pending-focus-session"); } catch {}
    } catch (e) {
      console.error("Session Record Error:", e);
      const errMsg =
        (e as any)?.shortMessage ||
        (e as any)?.message ||
        String(e);
      // Surface a retry toast so the user doesn't silently lose their session.
      // The pending-focus-session key stays in localStorage — if they reload,
      // the mount effect below will offer to retry again.
      toast.error(
        () =>
          React.createElement(
            "span",
            {
              style: { cursor: "pointer" },
              onClick: () => {
                toast.dismiss("session-retry");
                recordSession(minutes, superchargeMultiplier);
              },
            },
            `Session not recorded — tap to retry. (${errMsg.slice(0, 80)})`,
          ),
        { duration: Infinity, id: "session-retry" },
      );
    } finally {
      setIsSigning(false);
    }
  };

  // On mount: if a previous session submission was interrupted (provider died,
  // network dropped, user closed mid-signing), offer to retry it.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pending-focus-session");
      if (!raw) return;
      const { minutes, multiplier, timestamp } = JSON.parse(raw);
      // Only offer retry if the pending session is less than 2 hours old
      if (Date.now() - timestamp > 2 * 60 * 60 * 1000) {
        localStorage.removeItem("pending-focus-session");
        return;
      }
      // Remove immediately so this toast never loops — if retry also fails,
      // recordSession will re-save the key for the next mount.
      localStorage.removeItem("pending-focus-session");
      toast(
        () =>
          React.createElement(
            "span",
            {
              style: { cursor: "pointer" },
              onClick: () => {
                toast.dismiss("session-restore");
                recordSession(minutes, multiplier ?? 1);
              },
            },
            `⚠️ Unrecorded session (${Math.round(minutes)} min) — tap to save it.`,
          ),
        { duration: 20_000, id: "session-restore" },
      );
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Automated Buy Logic (Sequential Transactions) ---
  useEffect(() => {
    if (isConfirmed && pendingItem && lastAction === "shop") {
      const executeBuy = async () => {
        const item = pendingItem;
        setPendingItem(null); // Clear first to prevent loops

        console.log("🚀 Auto-triggering buy for:", item.id);

        if (item.functionName) {
          writeContract({
            ...txOverrides,
            address: CONTRACT_ADDRESS,
            abi: FocusPetABI,
            functionName: item.functionName as any,
            args: item.args as any,
            gas: BigInt(400_000),
          } as any);
        } else {
          // Fallback for older patterns
          await refetchAllowance();
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (item.id === "apple") buyFood();
          else if (item.id === "golden_apple") buySuperFood();
          else if (item.id === "energy_drink") buyEnergyDrink();
          else if (item.id === "shield") buyShield();
          else if (item.id === "revive") revivePet();
          else if (item.price) buyCosmetic(item.id, item.price);
        }
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

  // --- Dynamic Weather Calculation ---
  const [weather, setWeather] = useState<
    "sunny" | "clear" | "cloudy" | "rainy" | "stormy"
  >("clear");
  const [isNight, setIsNight] = useState<boolean>(false);

  // Streak + weather + time-of-day share a single 60s interval — same cadence,
  // overlapping dependencies, no reason for three separate timers.
  useEffect(() => {
    const calculateVirtualStreak = () => {
      if (lastDailySession > 0) {
        const now = Math.floor(Date.now() / 1000);
        const lastSessionDay = Math.floor(lastDailySession / (24 * 60 * 60));
        const currentDay = Math.floor(now / (24 * 60 * 60));
        if (currentDay > lastSessionDay + 1) {
          setVirtualStreak(shieldCount > 0 ? streak : 0);
        } else {
          setVirtualStreak(streak);
        }
      } else {
        setVirtualStreak(streak);
      }
    };

    const calculateWeather = () => {
      if (!lastDailySession) { setWeather("clear"); return; }
      const now = Math.floor(Date.now() / 1000);
      const diffHrs = (now - lastDailySession) / 3600;
      const recentInteractionHrs = (now - lastInteraction) / 3600;
      if (diffHrs < 24 || recentInteractionHrs < 24) {
        setWeather(recentInteractionHrs < 1 ? "sunny" : (streak > 1 ? "sunny" : "clear"));
      } else if (diffHrs < 48) {
        setWeather("cloudy");
      } else if (diffHrs < 72) {
        setWeather("rainy");
      } else {
        setWeather("stormy");
      }
    };

    const checkTime = () => {
      const hours = new Date().getHours();
      setIsNight(hours >= 20 || hours < 6);
    };

    calculateVirtualStreak();
    calculateWeather();
    checkTime();

    const interval = setInterval(() => {
      calculateVirtualStreak();
      calculateWeather();
      checkTime();
    }, 60_000);
    return () => clearInterval(interval);
  }, [streak, lastDailySession, lastInteraction]);

  const streakBonus = Math.min(
    20,
    (virtualStreak > 1 ? virtualStreak - 1 : 0) * 5,
  ); // 5% per day, max 20%

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
  const { writeContractAsync: writeSyncImpact, isPending: isSyncImpactLoading } =
    useUnifiedWriteContract();

  const handleSyncImpact = async () => {
    setLastAction("sync");
    try {
      await writeSyncImpact({
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "syncImpact",
        gas: BigInt(200_000),
      });
    } catch (error: any) {
      console.error("Sync impact failed:", error);
      toast.error("Sync failed\nPlease try again later.");
    }
  };

  return {
    petData,
    hasPet,
    isPending: finalIsPending,
    isConfirming: finalIsConfirming,
    isConfirmed: finalIsConfirmed,
    hash: singleHash,
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
    // USDT variants
    buyFoodWithUSDT,
    buySuperFoodWithUSDT,
    buyEnergyDrinkWithUSDT,
    buyShieldWithUSDT,
    revivePetWithUSDT,
    buyCosmeticWithUSDT,
    usdtBalanceRaw,
    setNames,
    deleteUser,
    // Economy
    gBalance,
    approveG,
    refetchGBalance,
    // UX
    isSigning,
    isProcessing: isSigning || finalIsPending || finalIsConfirming,
    isLoadingPet,
    isPetLoadError,
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
