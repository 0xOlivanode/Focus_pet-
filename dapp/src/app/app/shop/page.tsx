"use client";

import { useState, useEffect } from "react";
import { useFocusPet } from "@/hooks/useFocusPet";
import { useAuth } from "@/hooks/useAuth";
import { useIsMiniPay } from "@/hooks/useMiniPay";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { formatEther } from "viem";
import toast from "react-hot-toast";

// ── Launch discount config ─────────────────────────────────────────────────────
// 30% off all USDT items for MiniPay users during launch week.
// NOTE: Contract prices must also be updated to accept these lower amounts.
const LAUNCH_END_MS = new Date("2026-06-11T23:59:59Z").getTime();
const DISCOUNT_FACTOR = 70n; // 70% of original = 30% off

function applyDiscount(price: bigint): bigint {
  return (price * DISCOUNT_FACTOR) / 100n;
}

function fmtUsdt(raw: bigint): string {
  return `$${(Number(raw) / 1e6).toFixed(2)}`;
}

function getLaunchCountdown(now: number): { days: number; hours: number } {
  const ms = Math.max(0, LAUNCH_END_MS - now);
  const totalHours = Math.floor(ms / (1000 * 60 * 60));
  return { days: Math.floor(totalHours / 24), hours: totalHours % 24 };
}
// ──────────────────────────────────────────────────────────────────────────────

type Category = "consumables" | "boosts" | "cosmetics";

interface ShopItem {
  id: string;
  name: string;
  image?: string;
  price: number;
  usdtPrice?: bigint;
  usdtDisplay?: string;
  originalUsdtDisplay?: string; // pre-discount, shown crossed-out during launch
  tag: string;
  action: () => void;
  disabled: boolean;
  disabledLabel?: string;
  owned?: boolean;
  equipped?: boolean;
}

export default function ShopPage() {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const isMiniPay = useIsMiniPay();
  const [category, setCategory] = useState<Category>("consumables");
  const [now, setNow] = useState(Date.now());

  const {
    gBalance,
    health,
    isPending,
    isConfirming,
    isConfirmed,
    isSigning,
    isProcessing,
    writeError,
    receiptError,
    buyFood,
    buySuperFood,
    buyEnergyDrink,
    buyShield,
    buyCosmetic,
    toggleCosmetic,
    inventory,
    boostEndTime,
    shieldCount,
    equippedCosmetics,
    buyFoodWithUSDT,
    buySuperFoodWithUSDT,
    buyEnergyDrinkWithUSDT,
    buyShieldWithUSDT,
    buyCosmeticWithUSDT,
    usdtBalanceRaw,
  } = useFocusPet();

  // Update clock every minute for countdown accuracy
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Toast on tx error — must be before any early returns (Rules of Hooks)
  useEffect(() => {
    if (writeError || receiptError) {
      const err = writeError || receiptError;
      const cancelled = err?.message?.includes("user rejected");
      toast.error(
        cancelled ? "Purchase cancelled." : "Purchase failed. Try again.",
      );
    }
  }, [writeError, receiptError]);

  if (!isReady) return null;
  if (!isAuthenticated) {
    router.replace("/");
    return null;
  }

  const launchActive = isMiniPay && now < LAUNCH_END_MS;
  const countdown = getLaunchCountdown(now);

  const isBoostActive = boostEndTime * 1000 > Date.now();
  const balanceFormatted = gBalance
    ? parseFloat(formatEther(gBalance)).toFixed(2)
    : "0.00";
  const usdtBalanceFormatted = (Number(usdtBalanceRaw) / 1e6).toFixed(2);

  const canAfford = (price: number) =>
    gBalance !== undefined && gBalance >= BigInt(price) * BigInt(10 ** 18);

  const canAffordUSDT = (usdtPrice: bigint) => usdtBalanceRaw >= usdtPrice;

  // Original USDT prices
  const ORIG_FOOD       = BigInt(100_000);
  const ORIG_SUPER_FOOD = BigInt(250_000);
  const ORIG_ENERGY     = BigInt(200_000);
  const ORIG_SHIELD     = BigInt(500_000);
  const ORIG_SHADES     = BigInt(500_000);
  const ORIG_CROWN      = BigInt(5_000_000);

  // Display prices — show discounted during launch week, original otherwise.
  // The action functions do NOT pass a price override — the contract's
  // _discountedPrice() handles the actual charge. Approval uses the full
  // original price so there is never an allowance shortfall.
  const displayPrice = (orig: bigint) => launchActive ? applyDiscount(orig) : orig;

  const items: Record<Category, ShopItem[]> = {
    consumables: [
      {
        id: "apple",
        name: "Cyber Apple",
        image: "https://res.cloudinary.com/dmpulmnb9/image/upload/f_auto,q_auto/v1778778748/cyber-apple_rn3ksq.png",
        price: 10,
        usdtPrice: ORIG_FOOD,          // approval always uses full price — safe
        usdtDisplay: fmtUsdt(displayPrice(ORIG_FOOD)),
        originalUsdtDisplay: launchActive ? fmtUsdt(ORIG_FOOD) : undefined,
        tag: "+20 Health",
        action: isMiniPay ? () => buyFoodWithUSDT() : buyFood,
        disabled: health >= 100,
        disabledLabel: health >= 100 ? "Health Full" : undefined,
      },
      {
        id: "golden_apple",
        name: "Golden Apple",
        image: "https://res.cloudinary.com/dmpulmnb9/image/upload/f_auto,q_auto/v1778778750/golden-apple_a1ra1b.png",
        price: 30,
        usdtPrice: ORIG_SUPER_FOOD,
        usdtDisplay: fmtUsdt(displayPrice(ORIG_SUPER_FOOD)),
        originalUsdtDisplay: launchActive ? fmtUsdt(ORIG_SUPER_FOOD) : undefined,
        tag: "Max Health",
        action: isMiniPay ? () => buySuperFoodWithUSDT() : buySuperFood,
        disabled: health >= 100,
        disabledLabel: health >= 100 ? "Health Full" : undefined,
      },
    ],
    boosts: [
      {
        id: "energy_drink",
        name: "Energy Drink",
        image: "https://res.cloudinary.com/dmpulmnb9/image/upload/f_auto,q_auto/v1778778743/energy-drink_hzoqsb.png",
        price: 25,
        usdtPrice: ORIG_ENERGY,
        usdtDisplay: fmtUsdt(displayPrice(ORIG_ENERGY)),
        originalUsdtDisplay: launchActive ? fmtUsdt(ORIG_ENERGY) : undefined,
        tag: "2x XP (24h)",
        action: isMiniPay ? () => buyEnergyDrinkWithUSDT() : buyEnergyDrink,
        disabled: isBoostActive,
        disabledLabel: isBoostActive ? "Boost Active" : undefined,
      },
      {
        id: "shield",
        name: "Streak Shield",
        image: "https://res.cloudinary.com/dmpulmnb9/image/upload/f_auto,q_auto/v1778778745/streak-shield_kepght.png",
        price: 100,
        usdtPrice: ORIG_SHIELD,
        usdtDisplay: fmtUsdt(displayPrice(ORIG_SHIELD)),
        originalUsdtDisplay: launchActive ? fmtUsdt(ORIG_SHIELD) : undefined,
        tag: "Streak Protection",
        action: isMiniPay ? () => buyShieldWithUSDT() : buyShield,
        disabled: shieldCount > 0,
        disabledLabel: shieldCount > 0 ? "Shield Active" : undefined,
      },
    ],
    cosmetics: [
      {
        id: "sunglasses",
        name: "Cool Shades",
        image: "https://res.cloudinary.com/dmpulmnb9/image/upload/f_auto,q_auto/v1778778747/cool-shades_txvqei.png",
        price: 50,
        usdtPrice: ORIG_SHADES,
        usdtDisplay: fmtUsdt(displayPrice(ORIG_SHADES)),
        originalUsdtDisplay: launchActive ? fmtUsdt(ORIG_SHADES) : undefined,
        tag: "Cosmetic",
        action: inventory?.sunglasses
          ? () => toggleCosmetic("sunglasses")
          : isMiniPay
            ? () => buyCosmeticWithUSDT("sunglasses", ORIG_SHADES)
            : () => buyCosmetic("sunglasses", 50),
        disabled: false,
        owned: inventory?.sunglasses,
        equipped: equippedCosmetics?.sunglasses,
      },
      {
        id: "crown",
        name: "Royal Crown",
        image: "https://res.cloudinary.com/dmpulmnb9/image/upload/f_auto,q_auto/v1778778752/crown_xs1nxk.png",
        price: 500,
        usdtPrice: ORIG_CROWN,
        usdtDisplay: fmtUsdt(displayPrice(ORIG_CROWN)),
        originalUsdtDisplay: launchActive ? fmtUsdt(ORIG_CROWN) : undefined,
        tag: "Legendary",
        action: inventory?.crown
          ? () => toggleCosmetic("crown")
          : isMiniPay
            ? () => buyCosmeticWithUSDT("crown", ORIG_CROWN)
            : () => buyCosmetic("crown", 500),
        disabled: false,
        owned: inventory?.crown,
        equipped: equippedCosmetics?.crown,
      },
    ],
  };

  const CATEGORIES: Category[] = ["consumables", "boosts", "cosmetics"];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar onOpenProfile={() => router.push("/app?openProfile=true")} />

      {/* Full-screen processing overlay */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center gap-5 p-4"
          >
            <div className="relative w-20 h-20 flex items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.15, 0, 0.15] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-white"
              />
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0, 0.25] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="absolute inset-0 rounded-full bg-white"
              />
              <div className="w-14 h-14 rounded-full border border-neutral-800 bg-[#111111] flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-6 h-6 rounded-full border-2 border-transparent border-t-white"
                />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-white text-lg font-semibold mb-1">Processing…</h2>
              <p className="text-neutral-500 text-sm">
                {isSigning
                  ? "Getting ready…"
                  : isPending
                    ? "Confirm in your app…"
                    : isConfirming
                      ? "Saving…"
                      : "Almost there…"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-5 sm:px-8 lg:px-[80px] py-10">

        {/* Launch discount banner */}
        <AnimatePresence>
          {launchActive && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="mb-6 rounded-2xl overflow-hidden border border-amber-500/20 bg-[#0f0d00]"
            >
              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <span className="text-sm">🚀</span>
                  </div>
                  <div>
                    <p className="text-amber-400 font-black text-sm leading-tight">
                      30% off — Launch Week
                    </p>
                    <p className="text-neutral-500 text-xs font-medium mt-0.5">
                      Discounted prices applied automatically. Ends June 11.
                    </p>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-amber-400 font-black text-sm tabular-nums">
                    {countdown.days}d {countdown.hours}h
                  </p>
                  <p className="text-neutral-600 text-[10px] font-medium uppercase tracking-widest">
                    remaining
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl sm:text-[40px] font-medium tracking-tight">
            Pet Shop
          </h1>
          <div className="flex items-center gap-2 px-5 py-2.5 bg-[#111111] border border-neutral-800 rounded-full">
            <span className="text-neutral-500 text-sm">Balance</span>
            <span className="text-white text-sm font-semibold tabular-nums">
              {isMiniPay
                ? `${usdtBalanceFormatted} USDT`
                : `${balanceFormatted} G$`}
            </span>
          </div>
        </div>

        {/* Active effects */}
        {(isBoostActive || shieldCount > 0) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {isBoostActive && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-neutral-800 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-xs font-medium">2x XP Boost Active</span>
              </div>
            )}
            {shieldCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-neutral-800 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="text-white text-xs font-medium">{shieldCount}x Shield Active</span>
              </div>
            )}
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium capitalize transition-all ${
                category === cat
                  ? "bg-white text-black"
                  : "bg-[#111111] border border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Item grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="wait">
            {items[category].map((item, i) => {
              const affordable = isMiniPay
                ? canAffordUSDT(item.usdtPrice ?? BigInt(0))
                : canAfford(item.price);

              const blocked =
                isPending || item.disabled || (!item.owned && !affordable);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex flex-col bg-[#111111] border rounded-2xl overflow-hidden transition-colors ${
                    launchActive && isMiniPay
                      ? "border-amber-500/15"
                      : "border-neutral-800"
                  } ${!blocked ? "hover:border-neutral-600" : "opacity-50"}`}
                >
                  {/* Discount badge */}
                  {launchActive && isMiniPay && !item.owned && (
                    <div className="flex justify-end px-3 pt-3">
                      <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        −30%
                      </span>
                    </div>
                  )}

                  {/* Image area */}
                  <div className={`relative w-full aspect-4/3 bg-[#111111] flex items-center justify-center overflow-hidden ${launchActive && isMiniPay && !item.owned ? "pt-0" : ""}`}>
                    {item.image && (
                      <div className="w-full h-full flex items-center justify-center p-8">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="max-w-full max-h-full object-contain drop-shadow-2xl"
                        />
                      </div>
                    )}

                    {/* Status badge */}
                    {item.disabledLabel && (
                      <span className="absolute top-3 right-3 text-[11px] font-medium px-2.5 py-1 bg-black/60 border border-neutral-700 rounded-full text-neutral-400">
                        {item.disabledLabel}
                      </span>
                    )}
                    {!item.owned && !affordable && !item.disabled && (
                      <span className="absolute top-3 right-3 text-[11px] font-medium px-2.5 py-1 bg-black/60 border border-neutral-700 rounded-full text-neutral-500">
                        Insufficient {isMiniPay ? "USDT" : "G$"}
                      </span>
                    )}
                  </div>

                  {/* Name + tag row */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <span className="text-white text-base font-medium">{item.name}</span>
                    <span className="text-xs font-medium px-3 py-1 bg-[#1a1a1a] border border-neutral-800 rounded-full text-neutral-400">
                      {item.owned && category === "cosmetics"
                        ? item.equipped ? "Equipped" : "Owned"
                        : item.tag}
                    </span>
                  </div>

                  {/* Price + action row */}
                  <div className="flex items-center justify-between px-4 pb-4 pt-1">
                    {item.owned && category === "cosmetics" ? (
                      <span className="text-neutral-600 text-sm">Owned</span>
                    ) : isMiniPay && item.usdtDisplay ? (
                      <div className="flex flex-col">
                        <span className="text-white text-lg font-semibold tabular-nums leading-tight">
                          {item.usdtDisplay}
                          <span className="text-neutral-500 text-sm font-normal ml-1">USDT</span>
                        </span>
                        {item.originalUsdtDisplay && (
                          <span className="text-neutral-600 text-xs line-through tabular-nums mt-0.5">
                            {item.originalUsdtDisplay} USDT
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-white text-lg font-semibold tabular-nums">
                        {item.price} G$
                      </span>
                    )}

                    <button
                      onClick={item.action}
                      disabled={blocked}
                      className={`px-5 py-2 rounded-full text-sm font-semibold transition-all active:scale-95 disabled:cursor-not-allowed ${
                        item.owned && category === "cosmetics"
                          ? item.equipped
                            ? "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700"
                            : "bg-white text-black hover:bg-neutral-200"
                          : blocked
                            ? "bg-neutral-800 text-neutral-600"
                            : "bg-white text-black hover:bg-neutral-200"
                      }`}
                    >
                      {isPending
                        ? "…"
                        : item.owned && category === "cosmetics"
                          ? item.equipped ? "Remove" : "Equip"
                          : "Buy"}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
