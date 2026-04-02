"use client";

import { useAccount, useBalance, usePublicClient, useWalletClient, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { X, Copy, QrCode, Wallet, Plus, Send, ArrowLeft, Loader2, CheckCircle2, Gift } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { parseUnits, isAddress } from "viem";
import { useIdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";
import { GOOD_DOLLAR_ADDRESSES } from "@/config/contracts";

interface MiniPayAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ERC20_TRANSFER_ABI = [
  {
    name: "transfer",
    type: "function",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
  },
] as const;

type View = "main" | "send";

export function MiniPayAccountModal({ isOpen, onClose }: MiniPayAccountModalProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const identitySDK = useIdentitySDK("production");

  const [view, setView] = useState<View>("main");
  const [copied, setCopied] = useState(false);

  // G$ balance
  const { data: gDollarBalance, refetch: refetchBalance } = useBalance({
    address,
    token: GOOD_DOLLAR_ADDRESSES.CELO_MAINNET as `0x${string}`,
  });

  // Claim state
  const [claimStatus, setClaimStatus] = useState<"loading" | "can_claim" | "already_claimed" | "not_whitelisted">("loading");
  const [entitlement, setEntitlement] = useState<bigint>(BigInt(0));
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCheckingClaim, setIsCheckingClaim] = useState(false);

  // Send G$ state
  const [recipient, setRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendError, setSendError] = useState("");

  const { writeContract, data: sendTxHash, isPending: isSending, reset: resetSend } = useWriteContract();
  const { isSuccess: isSendSuccess, isLoading: isSendConfirming } = useWaitForTransactionReceipt({ hash: sendTxHash });

  // Reset view when modal closes
  useEffect(() => {
    if (!isOpen) {
      setView("main");
      setRecipient("");
      setSendAmount("");
      setSendError("");
      resetSend();
    }
  }, [isOpen]);

  // Refetch balance + re-check claim when send succeeds
  useEffect(() => {
    if (isSendSuccess) {
      toast.success("G$ sent!");
      refetchBalance();
      setRecipient("");
      setSendAmount("");
      resetSend();
      setView("main");
    }
  }, [isSendSuccess]);

  // Check G$ claim entitlement
  const checkEntitlement = async () => {
    if (!address || !publicClient || !identitySDK) return;
    try {
      setIsCheckingClaim(true);
      const claimSDK = new ClaimSDK({
        account: address,
        publicClient: publicClient as any,
        walletClient: (walletClient as any) || undefined,
        identitySDK: identitySDK as any,
        env: "production",
      });
      const walletStatus = await claimSDK.getWalletClaimStatus();
      setEntitlement(walletStatus.entitlement);
      setClaimStatus(walletStatus.status as any);
    } catch {
      setClaimStatus("not_whitelisted");
    } finally {
      setIsCheckingClaim(false);
    }
  };

  useEffect(() => {
    if (isOpen && address && publicClient && identitySDK) {
      checkEntitlement();
    }
  }, [isOpen, address, !!publicClient, !!identitySDK]);

  const handleClaim = async () => {
    if (!address || !publicClient || !walletClient || !identitySDK) return;
    try {
      setIsClaiming(true);
      const claimSDK = new ClaimSDK({
        account: address,
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        identitySDK: identitySDK as any,
        env: "production",
      });
      await claimSDK.claim();
      toast.success("G$ claimed!");
      await refetchBalance();
      await checkEntitlement();
    } catch (err: any) {
      toast.error(err?.shortMessage || "Claim failed");
    } finally {
      setIsClaiming(false);
    }
  };

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success("Address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const openDeeplink = (url: string) => {
    window.location.href = url;
  };

  const handleSend = () => {
    setSendError("");
    if (!isAddress(recipient)) {
      setSendError("Invalid wallet address");
      return;
    }
    const amt = parseFloat(sendAmount);
    if (!sendAmount || isNaN(amt) || amt <= 0) {
      setSendError("Enter a valid amount");
      return;
    }
    const balance = gDollarBalance ? parseFloat(gDollarBalance.formatted) : 0;
    if (amt > balance) {
      setSendError("Insufficient G$ balance");
      return;
    }
    writeContract({
      address: GOOD_DOLLAR_ADDRESSES.CELO_MAINNET as `0x${string}`,
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [recipient as `0x${string}`, parseUnits(sendAmount, gDollarBalance?.decimals ?? 2)],
      type: "legacy",
    });
  };

  const gBalance = gDollarBalance
    ? parseFloat(gDollarBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "—";

  const claimAmountDisplay = parseFloat((Number(entitlement) / 1e18).toFixed(2));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-t-[32px] shadow-2xl overflow-hidden pb-safe"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-200 dark:bg-neutral-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                {view === "send" ? (
                  <button
                    onClick={() => { setView("main"); setSendError(""); resetSend(); }}
                    className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors mr-1"
                  >
                    <ArrowLeft size={16} className="text-neutral-500" />
                  </button>
                ) : (
                  <img
                    src="/focus-pet-logo.jpeg"
                    className="w-7 h-7 rounded-full border border-neutral-100 dark:border-neutral-800"
                    alt="FocusPet"
                  />
                )}
                <span className="font-black text-sm text-neutral-900 dark:text-white">
                  {view === "send" ? "Send G$" : "My Wallet"}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={16} className="text-neutral-400" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {view === "main" ? (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -16 }}
                  transition={{ duration: 0.18 }}
                  className="px-6 pb-8 space-y-4"
                >
                  {/* Address card */}
                  <button
                    onClick={copyAddress}
                    className="w-full flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 group transition-colors hover:border-indigo-200 dark:hover:border-indigo-800"
                  >
                    <div className="text-left">
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-1">
                        Wallet Address
                      </p>
                      <p className="font-mono text-sm text-neutral-900 dark:text-white font-bold">
                        {address
                          ? `${address.slice(0, 8)}...${address.slice(-6)}`
                          : "—"}
                      </p>
                    </div>
                    <div
                      className={`p-2 rounded-xl transition-all ${
                        copied
                          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500"
                          : "bg-neutral-200 dark:bg-neutral-700 text-neutral-500 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-500"
                      }`}
                    >
                      <Copy size={15} />
                    </div>
                  </button>

                  {/* G$ Balance + Claim */}
                  <div className="rounded-2xl overflow-hidden border border-emerald-100 dark:border-emerald-900/40 bg-linear-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                          G$ Balance
                        </p>
                        <p className="font-mono font-black text-xl text-neutral-900 dark:text-white">
                          {gBalance}
                          <span className="text-xs font-bold text-neutral-400 ml-1">G$</span>
                        </p>
                      </div>

                      {/* Claim button */}
                      {isCheckingClaim ? (
                        <div className="px-4 py-2 rounded-xl bg-white/60 dark:bg-neutral-800/60">
                          <Loader2 size={14} className="animate-spin text-neutral-400" />
                        </div>
                      ) : claimStatus === "can_claim" ? (
                        <button
                          onClick={handleClaim}
                          disabled={isClaiming || entitlement === BigInt(0)}
                          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-colors disabled:opacity-50 shadow-sm shadow-emerald-500/30"
                        >
                          {isClaiming ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Gift size={12} />
                          )}
                          Claim {claimAmountDisplay > 0 ? `${claimAmountDisplay} G$` : "G$"}
                        </button>
                      ) : claimStatus === "already_claimed" ? (
                        <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/60 dark:bg-neutral-800/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          <CheckCircle2 size={12} />
                          Claimed
                        </div>
                      ) : claimStatus === "not_whitelisted" ? (
                        <div className="px-3.5 py-2 rounded-xl bg-white/60 dark:bg-neutral-800/60 text-neutral-400 font-bold text-xs">
                          Not verified
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Action grid */}
                  <div className="grid grid-cols-4 gap-2.5">
                    <button
                      onClick={() => openDeeplink("https://link.minipay.xyz/qr")}
                      className="flex flex-col items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                        <QrCode size={16} className="text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wide">
                        Receive
                      </span>
                    </button>

                    <button
                      onClick={() => openDeeplink("https://link.minipay.xyz/balance")}
                      className="flex flex-col items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                        <Wallet size={16} className="text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wide">
                        Balance
                      </span>
                    </button>

                    <button
                      onClick={() => openDeeplink("https://link.minipay.xyz/add_cash")}
                      className="flex flex-col items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <Plus size={16} className="text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wide">
                        Add Cash
                      </span>
                    </button>

                    <button
                      onClick={() => setView("send")}
                      className="flex flex-col items-center gap-2 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700 hover:border-amber-200 dark:hover:border-amber-800 transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                        <Send size={16} className="text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wide">
                        Send G$
                      </span>
                    </button>
                  </div>

                  {/* Powered by */}
                  <p className="text-center text-[10px] font-bold text-neutral-300 dark:text-neutral-600 uppercase tracking-widest pt-2">
                    Powered by MiniPay · Celo
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 16 }}
                  transition={{ duration: 0.18 }}
                  className="px-6 pb-8 space-y-4"
                >
                  {/* Balance pill */}
                  <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800 rounded-2xl">
                    <span className="text-xs font-bold text-neutral-500">Available</span>
                    <span className="font-mono font-black text-sm text-neutral-900 dark:text-white">
                      {gBalance} <span className="text-neutral-400 font-bold">G$</span>
                    </span>
                  </div>

                  {/* Recipient */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">
                      Recipient Address
                    </label>
                    <input
                      type="text"
                      placeholder="0x..."
                      value={recipient}
                      onChange={(e) => { setRecipient(e.target.value); setSendError(""); }}
                      className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl font-mono text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">
                      Amount (G$)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={sendAmount}
                        onChange={(e) => { setSendAmount(e.target.value); setSendError(""); }}
                        className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all pr-16"
                      />
                      <button
                        onClick={() => setSendAmount(gDollarBalance?.formatted ?? "")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-amber-500 hover:text-amber-600 uppercase tracking-wide"
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  {/* Error */}
                  {sendError && (
                    <p className="text-xs font-bold text-red-500 px-1">{sendError}</p>
                  )}

                  {/* Send button */}
                  <button
                    onClick={handleSend}
                    disabled={isSending || isSendConfirming}
                    className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm transition-colors disabled:opacity-50 shadow-md shadow-amber-500/20 active:scale-[0.98]"
                  >
                    {isSending || isSendConfirming ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        {isSendConfirming ? "Confirming..." : "Sending..."}
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        Send G$
                      </>
                    )}
                  </button>

                  <p className="text-center text-[10px] font-bold text-neutral-400 leading-relaxed">
                    Sending GoodDollar (G$) directly on Celo
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
