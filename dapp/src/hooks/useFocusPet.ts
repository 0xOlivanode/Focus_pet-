"use client";

import {
  useReadContracts,
  useWaitForTransactionReceipt,
} from "wagmi";
import { useUnifiedWriteContract } from "@/hooks/useUnifiedWriteContract";
import { FocusPetABI } from "@/config/abi";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import { CONTRACT_ADDRESS } from "@/config/contracts";

const USDT_ADDRESS = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
// CIP-64 fee-currency adapter for USDT. Passed explicitly on USDT transactions
// so detectMiniPayFeeCurrency (which makes an extra HTTP call) is bypassed —
// we already know the user has USDT from the balance check in executeUSDTBuy.
const USDT_FEE_ADAPTER = "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72" as const;

// USDT price constants (6 decimals, matching contract)
const PRICE_FOOD_USDT = BigInt(100_000);
const PRICE_SUPER_FOOD_USDT = BigInt(250_000);
const PRICE_ENERGY_DRINK_USDT = BigInt(200_000);
const PRICE_SHIELD_USDT = BigInt(500_000);
const PRICE_REVIVE_USDT = BigInt(250_000);
import { erc20Abi } from "viem";
import { useAuth } from "@/hooks/useAuth";

export function useFocusPet() {
  // Use useAuth so the address is available as soon as Web3Auth connects,
  // without waiting for the wagmi bridge to complete. useAuth falls back to
  // the Web3Auth EIP1193 provider address when wagmiAddress is not yet set.
  const { address } = useAuth();

  const txOverrides = {};

  const [isSigning, setIsSigning] = useState(false);
  const [lastAction, setLastAction] = useState<
    "focus" | "shop" | "profile" | null
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

  const {
    data: multicallData,
    refetch: refetchAll,
    isLoading: isLoadingPet,
    isError: isPetLoadError,
  } = useReadContracts({
    contracts: [
      // [0] pets
      {
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "pets",
        args: [address as `0x${string}`],
      },
      // [1] ownedCosmetics: sunglasses
      {
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "ownedCosmetics",
        args: [address as `0x${string}`, "sunglasses"],
      },
      // [2] ownedCosmetics: crown
      {
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "ownedCosmetics",
        args: [address as `0x${string}`, "crown"],
      },
      // [3] isCosmeticEquipped: sunglasses
      {
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "isCosmeticEquipped",
        args: [address as `0x${string}`, "sunglasses"],
      },
      // [4] isCosmeticEquipped: crown
      {
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "isCosmeticEquipped",
        args: [address as `0x${string}`, "crown"],
      },
      // [5] USDT balanceOf
      {
        address: USDT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      },
      // [6] USDT allowance
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
  const isSunglassesOwned = multicallData?.[1]?.result;
  const isCrownOwned = multicallData?.[2]?.result;
  const isSunglassesEquipped = multicallData?.[3]?.result;
  const isCrownEquipped = multicallData?.[4]?.result;
  const usdtBalanceRaw = multicallData?.[5]?.result ? (multicallData[5].result as bigint) : BigInt(0);
  const usdtAllowanceRaw = multicallData?.[6]?.result ? (multicallData[6].result as bigint) : BigInt(0);

  const refetch = refetchAll;

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
      }
    }
  }, [finalIsConfirmed, refetchAll, lastAction, hasToasted]);

  // ── USDT buy functions ──────────────────────────────────────────────────────
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
        feeCurrency: USDT_FEE_ADAPTER,
      } as any);
    } else {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: functionName as any,
        args: args as any,
        gas: BigInt(600_000),
        feeCurrency: USDT_FEE_ADAPTER,
      } as any);
    }
  };

  const buyFoodWithUSDT = (priceOverride?: bigint) =>
    executeUSDTBuy("buyFoodWithUSDT", priceOverride ?? PRICE_FOOD_USDT, [], "apple");
  const buySuperFoodWithUSDT = (priceOverride?: bigint) =>
    executeUSDTBuy("buySuperFoodWithUSDT", priceOverride ?? PRICE_SUPER_FOOD_USDT, [], "golden_apple");
  const buyEnergyDrinkWithUSDT = (priceOverride?: bigint) =>
    executeUSDTBuy("buyEnergyDrinkWithUSDT", priceOverride ?? PRICE_ENERGY_DRINK_USDT, [], "energy_drink");
  const buyShieldWithUSDT = (priceOverride?: bigint) =>
    executeUSDTBuy("buyShieldWithUSDT", priceOverride ?? PRICE_SHIELD_USDT, [], "shield");
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

        // Wait for MiniPay's RPC to index the new allowance before simulating
        // the buy. Without this delay, viem's eth_call runs against a node that
        // still shows allowance=0 → EstimateGasExecutionError even though the
        // approve confirmed on-chain.
        await new Promise((r) => setTimeout(r, 3000));

        if (item.functionName) {
          writeContract({
            ...txOverrides,
            address: CONTRACT_ADDRESS,
            abi: FocusPetABI,
            functionName: item.functionName as any,
            args: item.args as any,
            gas: BigInt(600_000),
            feeCurrency: USDT_FEE_ADAPTER,
          } as any);
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
    // USDT buy functions
    buyFoodWithUSDT,
    buySuperFoodWithUSDT,
    buyEnergyDrinkWithUSDT,
    buyShieldWithUSDT,
    revivePetWithUSDT,
    buyCosmeticWithUSDT,
    usdtBalanceRaw,
    setNames,
    deleteUser,
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
    streak: virtualStreak,
    streakBonus,
    weather,
    // Boosts & Cosmetics
    boostEndTime,
    shieldCount,
    activeCosmetic,
    equippedCosmetics: {
      sunglasses: !!isSunglassesEquipped,
      crown: !!isCrownEquipped,
    },
    toggleCosmetic,
    inventory: {
      sunglasses: !!isSunglassesOwned,
      crown: !!isCrownOwned,
    },
    totalDonated,
    isNight,
  };
}
