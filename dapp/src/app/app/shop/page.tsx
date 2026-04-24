"use client";

import { useState, useEffect } from "react";
import { useFocusPet } from "@/hooks/useFocusPet";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { formatEther } from "viem";
import toast from "react-hot-toast";

type Category = "consumables" | "boosts" | "cosmetics";

interface ShopItem {
  id: string;
  name: string;
  image?: string;
  price: number;
  tag: string;
  action: () => void;
  disabled: boolean;
  disabledLabel?: string;
  owned?: boolean;
  equipped?: boolean;
}

export default function ShopPage() {
  const { authenticated, ready: privyReady } = usePrivy();
  const router = useRouter();
  const [category, setCategory] = useState<Category>("consumables");

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
  } = useFocusPet();

  const isMiniPay =
    typeof window !== "undefined" && !!(window.ethereum as any)?.isMiniPay;

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

  if (!privyReady) return null;
  if (!authenticated && !isMiniPay) {
    router.replace("/");
    return null;
  }

  const isBoostActive = boostEndTime * 1000 > Date.now();
  const balanceFormatted = gBalance
    ? parseFloat(formatEther(gBalance)).toFixed(2)
    : "0.00";

  const canAfford = (price: number) =>
    gBalance !== undefined && gBalance >= BigInt(price) * BigInt(10 ** 18);

  const items: Record<Category, ShopItem[]> = {
    consumables: [
      {
        id: "apple",
        name: "Cyber Apple",
        image: "/assets/shop/cyber-apple.png",
        price: 10,
        tag: "+20 Health",
        action: buyFood,
        disabled: health >= 100,
        disabledLabel: health >= 100 ? "Health Full" : undefined,
      },
      {
        id: "golden_apple",
        name: "Golden Apple",
        image: "/assets/shop/golden-apple.png",
        price: 30,
        tag: "Max Health",
        action: buySuperFood,
        disabled: health >= 100,
        disabledLabel: health >= 100 ? "Health Full" : undefined,
      },
    ],
    boosts: [
      {
        id: "energy_drink",
        name: "Energy Drink",
        image: "/assets/shop/energy-drink.png",
        price: 25,
        tag: "2x XP (24h)",
        action: buyEnergyDrink,
        disabled: isBoostActive,
        disabledLabel: isBoostActive ? "Boost Active" : undefined,
      },
      {
        id: "shield",
        name: "Streak Shield",
        image: "/assets/shop/streak-shield.png",
        price: 100,
        tag: "Streak Protection",
        action: buyShield,
        disabled: shieldCount > 0,
        disabledLabel: shieldCount > 0 ? "Shield Active" : undefined,
      },
    ],
    cosmetics: [
      {
        id: "sunglasses",
        name: "Cool Shades",
        image: "/assets/shop/cool-shades.png",
        price: 50,
        tag: "Cosmetic",
        action: () =>
          inventory?.sunglasses
            ? toggleCosmetic("sunglasses")
            : buyCosmetic("sunglasses", 50),
        disabled: false,
        owned: inventory?.sunglasses,
        equipped: equippedCosmetics?.sunglasses,
      },
      {
        id: "crown",
        name: "Royal Crown",
        image: "/assets/shop/crown.png",
        price: 500,
        tag: "Legendary",
        action: () =>
          inventory?.crown
            ? toggleCosmetic("crown")
            : buyCosmetic("crown", 500),
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
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 rounded-full bg-white"
              />
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.25, 0, 0.25] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
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
              <h2 className="text-white text-lg font-semibold mb-1">
                Processing…
              </h2>
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
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl sm:text-[40px] font-medium tracking-tight">
            Pet Shop
          </h1>
          <div className="flex items-center gap-2 px-5 py-2.5 bg-[#111111] border border-neutral-800 rounded-full">
            <span className="text-neutral-500 text-sm">Balance</span>
            <span className="text-white text-sm font-semibold tabular-nums">
              {balanceFormatted} G$
            </span>
          </div>
        </div>

        {/* Active effects */}
        {(isBoostActive || shieldCount > 0) && (
          <div className="flex flex-wrap gap-2 mb-6">
            {isBoostActive && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-neutral-800 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span className="text-white text-xs font-medium">
                  2x XP Boost Active
                </span>
              </div>
            )}
            {shieldCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-neutral-800 rounded-full">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                <span className="text-white text-xs font-medium">
                  {shieldCount}x Shield Active
                </span>
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
              const affordable = canAfford(item.price);
              const blocked =
                isPending || item.disabled || (!item.owned && !affordable);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ delay: i * 0.05 }}
                  className={`flex flex-col bg-[#111111] border border-neutral-800 rounded-2xl overflow-hidden transition-colors ${
                    !blocked ? "hover:border-neutral-600" : "opacity-50"
                  }`}
                >
                  {/* Image area */}
                  <div className="relative w-full aspect-[4/3] bg-[#111111] flex items-center justify-center overflow-hidden">
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
                        Insufficient G$
                      </span>
                    )}
                  </div>

                  {/* Name + tag row */}
                  <div className="flex items-center justify-between px-4 pt-4 pb-2">
                    <span className="text-white text-base font-medium">
                      {item.name}
                    </span>
                    <span className="text-xs font-medium px-3 py-1 bg-[#1a1a1a] border border-neutral-800 rounded-full text-neutral-400">
                      {item.owned && category === "cosmetics"
                        ? item.equipped
                          ? "Equipped"
                          : "Owned"
                        : item.tag}
                    </span>
                  </div>

                  {/* Price + action row */}
                  <div className="flex items-center justify-between px-4 pb-4 pt-1">
                    {item.owned && category === "cosmetics" ? (
                      <span className="text-neutral-600 text-sm">Owned</span>
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
                          ? item.equipped
                            ? "Remove"
                            : "Equip"
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
