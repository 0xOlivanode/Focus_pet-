"use client";

import {
  useReadContracts,
  useWaitForTransactionReceipt,
} from "wagmi";
import { FocusPetABI } from "@/config/abi";
import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { encodeFunctionData, erc20Abi, type Abi } from "viem";

import { CONTRACT_ADDRESS } from "@/config/contracts";
import { useAuth } from "@/hooks/useAuth";

const USDT_ADDRESS    = "0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e";
// CIP-64 fee-currency adapter — tells MiniPay to charge gas in USDT.
const USDT_FEE        = "0x0e2a3e05bc9a16f5292a6170456a710cb89c6f72" as const;

// Sends a transaction through MiniPay's injected provider.
// Calls eth_requestAccounts first to ensure the session is authorized,
// then uses a viem walletClient with chain: celo so feeCurrency / CIP-64
// is serialized correctly — bypassing wagmi's public transport (Alchemy)
// which rejects Celo-specific tx fields.
function useMiniPayWrite() {
  const [hash, setHash]       = useState<`0x${string}` | undefined>(undefined);
  const [isPending, setIsPending] = useState(false);
  const [error, setError]     = useState<Error | null>(null);

  const sendAsync = useCallback(async (params: {
    address: `0x${string}`;
    abi: Abi | readonly unknown[];
    functionName: string;
    args?: readonly unknown[];
    gas?: bigint;
    feeCurrency?: `0x${string}`;
  }): Promise<`0x${string}`> => {
    setError(null);
    setIsPending(true);
    try {
      const ethereum = (window as any).ethereum;

      // Authorize the session before sending
      const accounts = await ethereum.request({ method: "eth_requestAccounts" }) as string[];
      const from = accounts[0] as `0x${string}`;

      const data = encodeFunctionData({
        abi: params.abi as Abi,
        functionName: params.functionName,
        args: params.args ?? [],
      });

      // Call eth_sendTransaction directly on window.ethereum — bypasses viem's
      // prepareTransactionRequest which strips feeCurrency before the RPC call.
      const txParams: Record<string, string> = {
        from,
        to:   params.address,
        data,
      };
      if (params.gas)        txParams.gas        = `0x${params.gas.toString(16)}`;
      if (params.feeCurrency) txParams.feeCurrency = params.feeCurrency;

      const txHash = await ethereum.request({
        method: "eth_sendTransaction",
        params: [txParams],
      }) as `0x${string}`;

      setHash(txHash);
      return txHash;
    } catch (err: any) {
      // Attach the raw RPC code so the error toast can show it
      const e = err instanceof Error ? err : new Error(String(err));
      (e as any).rpcCode = err?.code ?? err?.cause?.code ?? "?";
      setError(e);
      throw e;
    } finally {
      setIsPending(false);
    }
  }, []);

  const send = useCallback(
    (params: Parameters<typeof sendAsync>[0]) => { sendAsync(params).catch(() => {}); },
    [sendAsync],
  );

  return { send, sendAsync, hash, isPending, error };
}

function copyableErrorToast(msg: string) {
  toast.error(
    (t) => (
      <span
        onClick={() => {
          navigator.clipboard?.writeText(msg).catch(() => {});
          toast.dismiss(t.id);
        }}
        style={{ cursor: "pointer", userSelect: "all", display: "block" }}
        title="Tap to copy"
      >
        {msg}
      </span>
    ),
    { duration: 30000 },
  );
}

// USDT price constants (6 decimals, matching contract)
const PRICE_FOOD_USDT       = BigInt(100_000);
const PRICE_SUPER_FOOD_USDT = BigInt(250_000);
const PRICE_ENERGY_DRINK_USDT = BigInt(200_000);
const PRICE_SHIELD_USDT     = BigInt(500_000);
const PRICE_REVIVE_USDT     = BigInt(250_000);

export function useFocusPet() {
  // Use useAuth so the address is available as soon as Web3Auth connects,
  // without waiting for the wagmi bridge to complete. useAuth falls back to
  // the Web3Auth EIP1193 provider address when wagmiAddress is not yet set.
  const { address } = useAuth();

const [isSigning, setIsSigning] = useState(false);
  const [lastAction, setLastAction] = useState<
    "focus" | "shop" | "profile" | null
  >(null);
  const [hasToasted, setHasToasted] = useState(false);
  // After approve confirms, prompt user to tap again so the buy fires from a
  // direct user gesture — MiniPay blocks eth_sendTransaction from useEffect.
  const [pendingUSDTApproval, setPendingUSDTApproval] = useState(false);
  const [usdtApproved, setUsdtApproved] = useState(false);
  const [pendingBuyTx, setPendingBuyTx] = useState(false);
  const [expectedBuyHash, setExpectedBuyHash] = useState<`0x${string}` | undefined>();
  const [pendingSession, setPendingSession] = useState<{
    minutes: number;
    multiplier: number;
  } | null>(null);

  const {
    send: writeContract,
    sendAsync: writeContractAsync,
    hash: singleHash,
    isPending: isSinglePending,
    error: writeError,
  } = useMiniPayWrite();

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
      const err = writeError as any;
      const name: string  = err?.name ?? "";
      const code: number  = err?.code ?? err?.cause?.code ?? err?.rpcCode ?? 0;
      const msg: string   = err?.message ?? err?.cause?.message ?? String(writeError);
      console.error("[FocusPet] writeError", writeError);
      if (name === "UserRejectedRequestError" || code === 4001 || code === -32604) return;
      copyableErrorToast(`code=${code} | ${msg}`);
    }
  }, [writeError]);

  useEffect(() => {
    if (receiptError) {
      const err = receiptError as any;
      const msg: string = err?.message ?? err?.cause?.message ?? String(receiptError);
      console.error("[FocusPet] receiptError", receiptError);
      copyableErrorToast(msg);
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
        if (pendingBuyTx && singleHash && singleHash === expectedBuyHash) {
          setHasToasted(true);
          setPendingBuyTx(false);
          setExpectedBuyHash(undefined);
          toast.success("Purchase Successful!\nYour items are ready.");
          refetchAll();
        }
      } else if (lastAction === "profile") {
        setHasToasted(true);
        refetchAll();
      }
    }
  }, [finalIsConfirmed, refetchAll, lastAction, hasToasted, pendingBuyTx, singleHash, expectedBuyHash]);

  // ── USDT buy functions ──────────────────────────────────────────────────────
  const executeUSDTBuy = (
    functionName: string,
    usdtAmount: bigint,
    args: any[] = [],
  ) => {
    if (usdtBalanceRaw < usdtAmount) {
      toast.error("Insufficient USDT balance.");
      return;
    }
    setLastAction("shop");
    if (!usdtApproved && usdtAllowanceRaw < usdtAmount) {
      setPendingUSDTApproval(true);
      writeContract({
        address: USDT_ADDRESS as `0x${string}`,
        abi: erc20Abi,
        functionName: "approve",
        args: [CONTRACT_ADDRESS, usdtAmount],
        gas: BigInt(100_000),
        feeCurrency: USDT_FEE,
      });
    } else {
      setUsdtApproved(false);
      setPendingBuyTx(true);
      writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: functionName as any,
        args: args as any,
        gas: BigInt(600_000),
        feeCurrency: USDT_FEE,
      })
        .then((hash) => setExpectedBuyHash(hash))
        .catch(() => setPendingBuyTx(false));
    }
  };

  const buyFoodWithUSDT = (priceOverride?: bigint) =>
    executeUSDTBuy("buyFoodWithUSDT", priceOverride ?? PRICE_FOOD_USDT);
  const buySuperFoodWithUSDT = (priceOverride?: bigint) =>
    executeUSDTBuy("buySuperFoodWithUSDT", priceOverride ?? PRICE_SUPER_FOOD_USDT);
  const buyEnergyDrinkWithUSDT = (priceOverride?: bigint) =>
    executeUSDTBuy("buyEnergyDrinkWithUSDT", priceOverride ?? PRICE_ENERGY_DRINK_USDT);
  const buyShieldWithUSDT = (priceOverride?: bigint) =>
    executeUSDTBuy("buyShieldWithUSDT", priceOverride ?? PRICE_SHIELD_USDT);
  const revivePetWithUSDT = () =>
    executeUSDTBuy("revivePetWithUSDT", PRICE_REVIVE_USDT);
  const buyCosmeticWithUSDT = (cosmeticId: string, usdtPrice: bigint) =>
    executeUSDTBuy("buyCosmeticWithUSDT", usdtPrice, [cosmeticId, usdtPrice]);

  const toggleCosmetic = (id: string) => {
    setLastAction("shop");
    writeContract({
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

  // After approve confirms, refetch so the fresh allowance is cached, then
  // prompt the user to tap Buy again. MiniPay requires a direct user gesture
  // for eth_sendTransaction — auto-triggering from useEffect returns "Permission denied".
  useEffect(() => {
    if (isConfirmed && pendingUSDTApproval && lastAction === "shop") {
      setPendingUSDTApproval(false);
      setHasToasted(true);
      refetchAll().then(() => {
        setUsdtApproved(true);
        toast("Approved! Tap Buy again to complete your purchase.", { icon: "✅", duration: 10000 });
      });
    }
  }, [isConfirmed, pendingUSDTApproval, lastAction, refetchAll]);

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
