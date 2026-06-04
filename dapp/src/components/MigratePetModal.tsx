"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, AlertTriangle, CheckCircle, Loader2 } from "lucide-react";
import { isAddress } from "viem";
import { useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { FocusPetABI } from "@/config/abi";
import { CONTRACT_ADDRESS } from "@/config/contracts";
import toast from "react-hot-toast";

// What migrates and what doesn't — shown to user before confirming.
const MIGRATES = [
  "All XP, health, and evolution stage",
  "Streak and daily session history",
  "Pet name and username",
  "Owned and equipped cosmetics",
  "Total focus time and donation history",
];

const DOES_NOT_MIGRATE = [
  "Token balances (G$ / USDT) — send them manually",
  "Token approvals — re-approve on the new address",
  "G$ Supercharge stream — stop on old address, restart on new",
  "GoodDollar identity verification — re-verify on new address if needed",
];

type Step = "warn" | "input" | "confirm" | "done";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  hasPet: boolean;
}

export function MigratePetModal({ isOpen, onClose, hasPet }: Props) {
  const [step, setStep] = useState<Step>("warn");
  const [newAddress, setNewAddress] = useState("");
  const [addressError, setAddressError] = useState("");

  const {
    writeContractAsync,
    isPending,
    data: txHash,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isDone } =
    useWaitForTransactionReceipt({ hash: txHash });

  const handleClose = () => {
    onClose();
    // Reset after exit animation
    setTimeout(() => {
      setStep("warn");
      setNewAddress("");
      setAddressError("");
      reset();
    }, 300);
  };

  const validateAddress = () => {
    const trimmed = newAddress.trim();
    if (!trimmed) { setAddressError("Enter your MiniPay wallet address"); return false; }
    if (!isAddress(trimmed)) { setAddressError("Not a valid wallet address"); return false; }
    setAddressError("");
    return true;
  };

  const handleMigrate = async () => {
    if (!validateAddress()) return;
    try {
      await writeContractAsync({
        address: CONTRACT_ADDRESS,
        abi: FocusPetABI,
        functionName: "migratePet",
        args: [newAddress.trim() as `0x${string}`],
        gas: BigInt(500_000),
      });
      setStep("done");
    } catch (err: any) {
      const msg: string = err?.message ?? String(err);
      if (msg.includes("Target already has a pet")) {
        setAddressError("That address already has a FocusPet — choose a different one");
        setStep("input");
      } else if (msg.includes("No pet found")) {
        toast.error("No pet found on your current account.");
        handleClose();
      } else if (msg.includes("UserRejectedRequest") || err?.code === 4001) {
        // user cancelled — do nothing
      } else {
        toast.error("Migration failed — please try again.");
        setStep("confirm");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.2 }}
        className="relative bg-[#111111] w-full max-w-sm rounded-3xl border border-neutral-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="font-bold text-white text-lg">Migrate to MiniPay</h2>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
          >
            <X size={13} />
          </button>
        </div>

        <div className="px-6 pb-7">
          <AnimatePresence mode="wait">

            {/* Step 1 — Warning */}
            {step === "warn" && (
              <motion.div
                key="warn"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <p className="text-sm text-neutral-400 leading-relaxed">
                  This moves your entire FocusPet to a new wallet address. The action is <span className="text-white font-semibold">irreversible</span> — your current address will lose all pet data.
                </p>

                {!hasPet && (
                  <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-900/20 border border-red-800/40">
                    <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-400">You don't have a pet yet. Hatch one first before migrating.</p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">What moves</p>
                  {MIGRATES.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CheckCircle size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-xs text-neutral-300">{item}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">What does NOT move</p>
                  {DOES_NOT_MIGRATE.map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <X size={13} className="text-red-400 mt-0.5 shrink-0" />
                      <span className="text-xs text-neutral-400">{item}</span>
                    </div>
                  ))}
                </div>

                <button
                  disabled={!hasPet}
                  onClick={() => setStep("input")}
                  className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  I understand — continue
                  <ArrowRight size={15} />
                </button>
              </motion.div>
            )}

            {/* Step 2 — Enter address */}
            {step === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Enter your <span className="text-white font-semibold">MiniPay wallet address</span>. Open MiniPay, tap your address to copy it, then paste it here.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">
                    MiniPay Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={newAddress}
                    onChange={(e) => { setNewAddress(e.target.value); setAddressError(""); }}
                    className="w-full px-4 py-3.5 bg-[#1a1a1a] border border-neutral-800 focus:border-indigo-500 rounded-2xl text-white placeholder-neutral-600 font-mono text-sm outline-none transition-colors"
                    spellCheck={false}
                    autoComplete="off"
                  />
                  {addressError && (
                    <p className="text-xs text-red-400 font-medium">{addressError}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("warn")}
                    className="flex-1 h-12 rounded-2xl border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-white font-bold text-sm transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => { if (validateAddress()) setStep("confirm"); }}
                    className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    Review
                    <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3 — Final confirm */}
            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40 space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-amber-400 shrink-0" />
                    <span className="text-xs font-black text-amber-400 uppercase tracking-widest">Final check</span>
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Your pet will move to:
                  </p>
                  <p className="text-xs font-mono text-white break-all">{newAddress.trim()}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Your current address will have no pet after this. This cannot be undone.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setStep("input")}
                    disabled={isPending || isConfirming}
                    className="flex-1 h-12 rounded-2xl border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-white font-bold text-sm transition-all disabled:opacity-40"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleMigrate}
                    disabled={isPending || isConfirming}
                    className="flex-1 h-12 rounded-2xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    {isPending || isConfirming ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Confirm Migration"
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4 — Done */}
            {step === "done" && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="space-y-4 text-center"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCircle size={32} className="text-emerald-400" />
                  </div>
                </div>

                <div>
                  <p className="text-white font-bold text-lg">Migration complete</p>
                  <p className="text-neutral-400 text-sm mt-1">Your pet has moved to your MiniPay wallet.</p>
                </div>

                <div className="p-3 rounded-2xl bg-[#1a1a1a] border border-neutral-800 text-left space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Next steps</p>
                  <p className="text-xs text-neutral-300">1. Open FocusPet inside MiniPay — your pet is waiting.</p>
                  <p className="text-xs text-neutral-300">2. Transfer any G$ or USDT from your old wallet manually.</p>
                  <p className="text-xs text-neutral-300">3. Log out of this session.</p>
                </div>

                <button
                  onClick={handleClose}
                  className="w-full h-12 rounded-2xl bg-white hover:bg-neutral-100 text-black font-bold text-sm transition-all"
                >
                  Done
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
