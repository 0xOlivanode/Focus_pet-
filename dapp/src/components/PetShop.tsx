"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  AlertCircle,
  Loader2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Info,
  Lock,
} from "lucide-react";
import { formatEther } from "viem";

interface ShopItem {
  id: string;
  name: string;
  emoji: string;
  price: number;
  desc: string;
  action: () => void;
  disabled: boolean;
  disabledReason?: string;
  image?: string;
}

interface PetShopProps {
  gBalance: bigint | undefined;
  allowance: bigint;
  health: number;
  isPending: boolean;
  isSuccess: boolean;
  writeError: any;
  receiptError: any;
  onApprove: (amount: bigint, itemId?: string, price?: number) => void;
  onBuyFood: () => void;
  onBuySuperFood: () => void;
  onBuyEnergyDrink: () => void;
  onBuyShield: () => void;
  onBuyCosmetic: (id: string, price: number) => void;
  onToggleCosmetic: (id: string) => void;
  inventory: Record<string, boolean>;
  onRevive: () => void;
  playSound: (sound: any) => void;
  showToast: (
    title: string,
    message: string,
    type: "success" | "error" | "info",
  ) => void;
  boostEndTime: number;
  shieldCount: number;
  activeCosmetic: string;
}

export function PetShop({
  gBalance,
  allowance,
  health,
  isPending,
  isSuccess,
  writeError,
  receiptError,
  onApprove,
  onBuyFood,
  onBuySuperFood,
  onBuyEnergyDrink,
  onBuyShield,
  onBuyCosmetic,
  onToggleCosmetic,
  inventory,
  onRevive,
  playSound,
  showToast,
  boostEndTime,
  shieldCount,
  activeCosmetic,
}: PetShopProps) {
  const [shopCategory, setShopCategory] = useState<
    "consumables" | "boosts" | "cosmetics"
  >("consumables");

  const isBoostActive = boostEndTime * 1000 > Date.now();

  // Professional Toast Feedback for Transactions
  useEffect(() => {
    if (writeError || receiptError) {
      const error = writeError || receiptError;
      const isCancelled = error?.message?.includes("user rejected");

      showToast(
        isCancelled ? "Purchase Cancelled" : "Transmission Error",
        isCancelled
          ? "You declined the request in your wallet."
          : "Something went wrong on-chain. Please check your network.",
        "error",
      );
    }
  }, [writeError, receiptError, showToast]);

  const shopItems: Record<string, ShopItem[]> = {
    consumables: [
      {
        id: "apple",
        name: "Cyber Apple",
        image: "/assets/shop/apple.png",
        emoji: "🍎",
        price: 10,
        desc: "+20 Health",
        action: onBuyFood,
        disabled: health >= 100,
        disabledReason: health >= 100 ? "Health Full" : undefined,
      },
      {
        id: "golden_apple",
        name: "Golden Apple",
        image: "/assets/shop/golden_apple.png",
        emoji: "✨🍎",
        price: 30,
        desc: "Max Health",
        action: onBuySuperFood,
        disabled: health >= 100,
        disabledReason: health >= 100 ? "Health Full" : undefined,
      },
    ],
    boosts: [
      {
        id: "energy_drink",
        name: "Energy Drink",
        image: "/assets/shop/energy_drink.png",
        emoji: "🥤",
        price: 25,
        desc: "2x XP (24h)",
        action: onBuyEnergyDrink,
        disabled: isBoostActive,
        disabledReason: isBoostActive ? "Boost Active" : undefined,
      },
      {
        id: "shield",
        name: "Streak Shield",
        image: "/assets/shop/potion.png",
        emoji: "🛡️",
        price: 100,
        desc: "One time protection",
        action: onBuyShield,
        disabled: shieldCount > 0,
        disabledReason: shieldCount > 0 ? "Shield Active" : undefined,
      },
    ],
    cosmetics: [
      {
        id: "sunglasses",
        name: "Cool Shades",
        emoji: "🕶️",
        price: 50,
        desc: "Style +10",
        action: () =>
          inventory.sunglasses
            ? onToggleCosmetic("sunglasses")
            : onBuyCosmetic("sunglasses", 50),
        disabled: false,
      },
      {
        id: "crown",
        name: "Royal Crown",
        emoji: "👑",
        price: 500,
        desc: "Legendary",
        action: () =>
          inventory.crown
            ? onToggleCosmetic("crown")
            : onBuyCosmetic("crown", 500),
        disabled: false,
      },
    ],
  };

  useEffect(() => {
    console.log(formatEther(gBalance || 0n), "balance");
  }, [gBalance]);

  const balanceFormatted = gBalance
    ? parseFloat(formatEther(gBalance)).toFixed(2)
    : "0.00";

  return (
    <div className="relative w-full mt-8 bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 md:p-6 border border-neutral-100 dark:border-neutral-800">
      {/* Active Effects Header */}
      {(isBoostActive || shieldCount > 0) && (
        <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-2">
          {isBoostActive && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200/50 dark:border-800/50 shadow-sm transition-all hover:scale-105">
              <TrendingUp size={12} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                2x XP Boost Active
              </span>
            </div>
          )}
          {shieldCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50 shadow-sm transition-all hover:scale-105">
              <Sparkles size={12} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {shieldCount}x Shield Protected
              </span>
            </div>
          )}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <span className="text-xl">🛍️</span>
          </div>
          <h2 className="font-black text-xl tracking-tight">Pet Shop</h2>
        </div>

        <div className="flex items-center gap-4 bg-white/50 dark:bg-black/20 backdrop-blur-sm self-start md:self-auto p-1.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
          <div className="px-3 text-right">
            <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">
              Balance
            </p>
            <p className="font-mono text-indigo-600 dark:text-indigo-400 font-black text-sm">
              {balanceFormatted} G$
            </p>
          </div>
        </div>
      </div>

      {/* Shop Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {["consumables", "boosts", "cosmetics"].map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setShopCategory(cat as any);
              playSound("click");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
              shopCategory === cat
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 active:scale-95"
                : "bg-white dark:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 border border-neutral-100 dark:border-neutral-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Shop Items */}
      <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 md:gap-4">
        {shopItems[shopCategory].map((item) => {
          const needsApproval =
            allowance < BigInt(item.price) * BigInt(10 ** 18);

          return (
            <motion.button
              key={item.id}
              disabled={
                isPending ||
                item.disabled ||
                (gBalance !== undefined &&
                  gBalance < BigInt(item.price) * BigInt(10 ** 18))
              }
              whileHover={
                !isPending &&
                !item.disabled &&
                gBalance !== undefined &&
                gBalance >= BigInt(item.price) * BigInt(10 ** 18)
                  ? { scale: 1.02, y: -4 }
                  : {}
              }
              whileTap={
                !isPending &&
                !item.disabled &&
                gBalance !== undefined &&
                gBalance >= BigInt(item.price) * BigInt(10 ** 18)
                  ? { scale: 0.96 }
                  : {}
              }
              onClick={() => {
                if (needsApproval) {
                  onApprove(
                    BigInt(item.price) * BigInt(Math.pow(10, 18)),
                    item.id,
                    item.price,
                  );
                } else {
                  item.action();
                  if (item.id.includes("apple")) playSound("buy");
                }
              }}
              className={`group relative flex flex-col items-center justify-center gap-3 p-5 md:p-7 rounded-4xl transition-all border-2 ${
                isPending ||
                item.disabled ||
                (gBalance !== undefined &&
                  gBalance < BigInt(item.price) * BigInt(10 ** 18))
                  ? "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 opacity-40 cursor-not-allowed grayscale"
                  : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10"
              }`}
            >
              {item.disabled && item.disabledReason && (
                <div className="absolute top-2 right-2 bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase text-neutral-500 border border-neutral-300 dark:border-neutral-700 pointer-events-none">
                  {item.disabledReason}
                </div>
              )}
              {gBalance !== undefined &&
                gBalance < BigInt(item.price) * BigInt(10 ** 18) &&
                !item.disabled && (
                  <div className="absolute top-2 right-2 bg-red-500/10 dark:bg-red-500/20 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase text-red-500 border border-red-500/20 pointer-events-none">
                    Too Expensive
                  </div>
                )}
              <div className="text-4xl group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">
                <span>{item.emoji}</span>
              </div>
              <div className="text-center w-full">
                <p className="font-black text-sm mb-0.5 text-neutral-800 dark:text-neutral-100">
                  {item.name}
                </p>
                <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                  {item.desc}
                </p>
                {shopCategory === "cosmetics" && inventory[item.id] ? (
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full border-2 transition-all duration-300 ${
                        activeCosmetic === item.id
                          ? "bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]"
                          : "bg-white dark:bg-neutral-800 border-neutral-100 dark:border-neutral-700 text-neutral-500"
                      }`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        {activeCosmetic === item.id ? "Active" : "Owned"}
                      </span>
                      {activeCosmetic === item.id && (
                        <motion.div
                          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                        />
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">
                      {activeCosmetic === item.id
                        ? "Click to Remove"
                        : "Click to Wear"}
                    </p>
                  </div>
                ) : needsApproval ? (
                  <div className="flex flex-col items-center gap-1 group/sec">
                    <p className="flex items-center gap-1 text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-200/50 group-hover/sec:border-indigo-400 transition-colors">
                      <Lock size={10} className="text-indigo-400" />
                      Enable G$
                    </p>
                    <span className="text-[7px] font-bold text-neutral-400 uppercase tracking-[0.2em] opacity-0 group-hover/sec:opacity-100 transition-opacity">
                      Secure One-time Setup
                    </span>
                  </div>
                ) : (
                  <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full inline-block">
                    {item.price} G$
                  </p>
                )}
              </div>

              {/* Sexy Active Overlay for Cosmetics */}
              {shopCategory === "cosmetics" && activeCosmetic === item.id && (
                <motion.div
                  layoutId="cosmetic-active-ring"
                  className="absolute inset-0 border-2 border-indigo-500/50 rounded-4xl pointer-events-none"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="absolute inset-0 bg-indigo-500/5 rounded-4xl animate-pulse" />
                </motion.div>
              )}
            </motion.button>
          );
        })}

        {/* Revive Special Case Logic */}
        {shopCategory === "consumables" && (
          <motion.button
            disabled={health > 0 || isPending}
            whileHover={
              health === 0 && !isPending ? { scale: 1.02, y: -4 } : {}
            }
            whileTap={health === 0 && !isPending ? { scale: 0.96 } : {}}
            onClick={() => {
              const price = BigInt(50 * 10 ** 18);
              const reviveNeedsApproval = allowance < price;
              if (reviveNeedsApproval) {
                onApprove(price, "revive");
              } else {
                onRevive();
                playSound("buy");
              }
            }}
            className={`group relative flex flex-col items-center justify-center gap-3 p-5 md:p-7 rounded-4xl transition-all border-2 ${
              health > 0 || isPending
                ? "bg-neutral-50 dark:bg-neutral-800/50 border-neutral-100 dark:border-neutral-800 opacity-40 cursor-not-allowed grayscale"
                : "bg-white dark:bg-neutral-900 border-neutral-100 dark:border-neutral-800 hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10"
            }`}
          >
            <div className="text-4xl group-hover:scale-110 transition-transform duration-500 drop-shadow-sm">
              🧪
            </div>
            <div className="text-center w-full">
              <p className="font-black text-sm mb-0.5 text-neutral-800 dark:text-neutral-100">
                Eco Potion
              </p>
              <p className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest mb-1.5">
                Revives Dead Pet
              </p>
              {allowance < BigInt(50 * 10 ** 18) ? (
                <div className="flex flex-col items-center gap-1">
                  <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-3 py-1 rounded-full border border-indigo-200/50">
                    Enable G$
                  </p>
                  <span className="text-[7px] font-bold text-neutral-400 uppercase tracking-[0.2em]">
                    One-time Setup
                  </span>
                </div>
              ) : (
                <p className="text-[10px] font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 rounded-full inline-block">
                  50 G$
                </p>
              )}
            </div>
            {health > 0 && (
              <div className="absolute inset-0 bg-neutral-900/5 backdrop-blur-[1px] rounded-4xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-white/90 dark:bg-neutral-800 px-3 py-1 rounded-xl text-[10px] font-black uppercase text-neutral-500 shadow-sm border border-neutral-100 dark:border-neutral-700">
                  Pet's Alive
                </span>
              </div>
            )}
          </motion.button>
        )}
      </div>

      {/* Mining State Indicator (Discreet) */}
      <AnimatePresence>
        {isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mt-4 flex items-center justify-center gap-3 p-4 rounded-2xl bg-indigo-600/10 text-indigo-600 border border-indigo-200/50 dark:border-indigo-800/20"
          >
            <Loader2 className="animate-spin" size={16} />
            <span className="text-[10px] font-black tracking-widest uppercase">
              Mining On-Chain...
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
