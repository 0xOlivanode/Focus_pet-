"use client";

import {
  useAccount,
  useBalance,
  usePublicClient,
  useWalletClient,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  X,
  Copy,
  QrCode,
  Wallet,
  Plus,
  Send,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Gift,
  ScanLine,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { parseUnits, isAddress } from "viem";
import { useIdentitySDK } from "@goodsdks/identity-sdk";
import { ClaimSDK } from "@goodsdks/citizen-sdk";
import { GOOD_DOLLAR_ADDRESSES } from "@/config/contracts";
import { miniPayScanQrCode, miniPayGetExchangeRate } from "@/hooks/useMiniPay";

const USDm_ADDRESS = "0x765DE816845861e75A25fCA122bb6898B8B1282a";

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

interface MiniPayAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MiniPayAccountModal({ isOpen, onClose }: MiniPayAccountModalProps) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const identitySDK = useIdentitySDK("production");

  const [view, setView] = useState<View>("main");
  const [copied, setCopied] = useState(false);

  const { data: gDollarBalance, refetch: refetchGBalance } = useBalance({
    address,
    token: GOOD_DOLLAR_ADDRESSES.CELO_MAINNET as `0x${string}`,
  });
  const { data: usdmBalance } = useBalance({
    address,
    token: USDm_ADDRESS as `0x${string}`,
  });

  // Local currency equivalent for USDm
  const [localRate, setLocalRate] = useState<number | null>(null);
  const [localCurrency, setLocalCurrency] = useState("USD");
  useEffect(() => {
    if (!isOpen) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    const currency = tz.startsWith("Africa/Lagos") ? "NGN" : "USD";
    setLocalCurrency(currency);
    if (currency !== "USD") {
      miniPayGetExchangeRate("USDm", currency).then((r) => {
        if (r) setLocalRate(r);
      });
    }
  }, [isOpen]);

  // G$ claim
  const [claimStatus, setClaimStatus] = useState<
    "loading" | "can_claim" | "already_claimed" | "not_whitelisted"
  >("loading");
  const [entitlement, setEntitlement] = useState<bigint>(BigInt(0));
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCheckingClaim, setIsCheckingClaim] = useState(false);

  // Send state
  const [recipient, setRecipient] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sendError, setSendError] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const {
    writeContract,
    data: sendTxHash,
    isPending: isSending,
    reset: resetSend,
    error: sendWriteError,
  } = useWriteContract();
  const { isSuccess: isSendSuccess, isLoading: isSendConfirming } =
    useWaitForTransactionReceipt({ hash: sendTxHash });

  useEffect(() => {
    if (!isOpen) {
      setView("main");
      setRecipient("");
      setSendAmount("");
      setSendError("");
      resetSend();
    }
  }, [isOpen]);

  // After send → native MiniPay receipt with confetti
  useEffect(() => {
    if (isSendSuccess && sendTxHash) {
      refetchGBalance();
      window.location.href = `https://link.minipay.xyz/receipt?tx=${sendTxHash}&celebrate`;
    }
  }, [isSendSuccess, sendTxHash]);

  // Error by code/name — not message text
  useEffect(() => {
    if (!sendWriteError) return;
    const name = (sendWriteError as any)?.name ?? "";
    const code = (sendWriteError as any)?.code ?? 0;
    if (name === "UserRejectedRequestError" || code === 4001) {
      setSendError("Cancelled");
    } else if (code === -32602) {
      setSendError("Invalid address or amount");
    } else {
      setSendError("Failed — try again");
    }
  }, [sendWriteError]);

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
    if (isOpen && address && publicClient && identitySDK) checkEntitlement();
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
      await refetchGBalance();
      await checkEntitlement();
    } catch (err: any) {
      const name = err?.name ?? "";
      const code = err?.code ?? 0;
      toast.error(
        name === "UserRejectedRequestError" || code === 4001
          ? "Cancelled"
          : "Claim failed — try again",
      );
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

  const handleScanQr = async () => {
    setIsScanning(true);
    try {
      const result = await miniPayScanQrCode();
      if (result) {
        const addr = result.replace(/^ethereum:/i, "").split("?")[0].trim();
        setRecipient(addr);
        setSendError("");
      } else {
        toast.error("No address scanned");
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleSend = () => {
    setSendError("");
    if (!isAddress(recipient)) { setSendError("Invalid wallet address"); return; }
    const amt = parseFloat(sendAmount);
    if (!sendAmount || isNaN(amt) || amt <= 0) { setSendError("Enter a valid amount"); return; }
    const balance = gDollarBalance ? parseFloat(gDollarBalance.formatted) : 0;
    if (amt > balance) { setSendError("Insufficient G$ balance"); return; }
    writeContract({
      address: GOOD_DOLLAR_ADDRESSES.CELO_MAINNET as `0x${string}`,
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [recipient as `0x${string}`, parseUnits(sendAmount, gDollarBalance?.decimals ?? 2)],
    });
  };

  const gBalance = gDollarBalance
    ? parseFloat(gDollarBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "—";

  const usdmFormatted = usdmBalance
    ? parseFloat(usdmBalance.formatted).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : "—";

  const usdmLocalValue =
    usdmBalance && localRate && localCurrency !== "USD"
      ? (parseFloat(usdmBalance.formatted) * localRate).toLocaleString(undefined, { maximumFractionDigits: 0 })
      : null;

  const claimAmountDisplay = parseFloat((Number(entitlement) / 1e18).toFixed(2));

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#111111] border-t border-neutral-800 rounded-t-[32px] shadow-2xl overflow-hidden pb-safe"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-700" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                {view === "send" ? (
                  <button
                    onClick={() => { setView("main"); setSendError(""); resetSend(); }}
                    className="p-1.5 rounded-full hover:bg-neutral-800 transition-colors mr-0.5"
                  >
                    <ArrowLeft size={16} className="text-neutral-400" />
                  </button>
                ) : (
                  <Image
                    src="/focus-pet-logo.jpeg"
                    width={28}
                    height={28}
                    alt="FocusPet"
                    className="rounded-full border border-neutral-800"
                  />
                )}
                <span className="font-bold text-white">
                  {view === "send" ? "Send G$" : "My Wallet"}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-neutral-800 transition-colors"
              >
                <X size={18} className="text-neutral-400" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              {view === "main" ? (
                <motion.div
                  key="main"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                  className="px-6 pb-10 space-y-3"
                >
                  {/* Wallet address */}
                  <button
                    onClick={copyAddress}
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-neutral-800 bg-[#1a1a1a] hover:bg-neutral-800 transition-all group"
                  >
                    <div className="text-left">
                      <div className="text-xs text-neutral-500 uppercase tracking-widest mb-0.5">
                        Wallet Address
                      </div>
                      <div className="font-medium text-white font-mono text-sm">
                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "—"}
                      </div>
                    </div>
                    <Copy
                      size={16}
                      className={`transition-colors ${copied ? "text-indigo-400" : "text-neutral-600 group-hover:text-indigo-400"}`}
                    />
                  </button>

                  {/* Balances grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* USDm */}
                    <div className="p-4 rounded-3xl border border-neutral-800 bg-neutral-800/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                          <span className="text-[9px] text-white font-black">$</span>
                        </div>
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                          USDm
                        </span>
                      </div>
                      <div className="font-bold text-lg text-white">
                        {usdmFormatted}
                      </div>
                      {usdmLocalValue && (
                        <div className="text-[10px] font-medium text-neutral-500 mt-0.5">
                          ≈ {localCurrency} {usdmLocalValue}
                        </div>
                      )}
                    </div>

                    {/* G$ */}
                    <div className="p-4 rounded-3xl border border-neutral-800 bg-neutral-800/30">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                          <span className="text-[9px] text-white font-black">G</span>
                        </div>
                        <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                          G$
                        </span>
                      </div>
                      <div className="font-bold text-lg text-white">
                        {gBalance}
                      </div>
                      {/* Claim CTA inline */}
                      <div className="mt-2">
                        {isCheckingClaim ? (
                          <Loader2 size={11} className="animate-spin text-neutral-600" />
                        ) : claimStatus === "can_claim" ? (
                          <button
                            onClick={handleClaim}
                            disabled={isClaiming || entitlement === BigInt(0)}
                            className="flex items-center gap-1 text-[10px] font-black text-indigo-400 hover:text-indigo-300 transition-colors disabled:opacity-50 uppercase tracking-widest"
                          >
                            {isClaiming ? (
                              <Loader2 size={10} className="animate-spin" />
                            ) : (
                              <Gift size={10} />
                            )}
                            Claim {claimAmountDisplay > 0 ? `${claimAmountDisplay} G$` : "daily"}
                          </button>
                        ) : claimStatus === "already_claimed" ? (
                          <span className="flex items-center gap-1 text-[10px] font-black text-neutral-600 uppercase tracking-widest">
                            <CheckCircle2 size={10} />
                            Claimed today
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-4 gap-2">
                    <button
                      onClick={() => window.location.href = "https://link.minipay.xyz/qr"}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-neutral-800 bg-[#1a1a1a] hover:bg-neutral-800 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center">
                        <QrCode size={16} className="text-neutral-300" />
                      </div>
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wide">
                        Receive
                      </span>
                    </button>

                    <button
                      onClick={() => window.location.href = "https://link.minipay.xyz/balance"}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-neutral-800 bg-[#1a1a1a] hover:bg-neutral-800 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center">
                        <Wallet size={16} className="text-neutral-300" />
                      </div>
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wide">
                        Balance
                      </span>
                    </button>

                    <button
                      onClick={() => window.location.href = "https://link.minipay.xyz/add_cash"}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-neutral-800 bg-[#1a1a1a] hover:bg-neutral-800 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center">
                        <Plus size={16} className="text-neutral-300" />
                      </div>
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wide">
                        Add Cash
                      </span>
                    </button>

                    <button
                      onClick={() => setView("send")}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl border border-neutral-800 bg-[#1a1a1a] hover:bg-neutral-800 transition-all"
                    >
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 flex items-center justify-center">
                        <Send size={16} className="text-neutral-300" />
                      </div>
                      <span className="text-[9px] font-black text-neutral-500 uppercase tracking-wide">
                        Send G$
                      </span>
                    </button>
                  </div>

                  <p className="text-center text-[10px] font-bold text-neutral-700 uppercase tracking-widest pt-1">
                    Powered by MiniPay · Celo
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="send"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.15 }}
                  className="px-6 pb-10 space-y-4"
                >
                  {/* Available balance */}
                  <div className="flex items-center justify-between p-3 rounded-2xl border border-neutral-800 bg-[#1a1a1a]">
                    <span className="text-xs text-neutral-500 uppercase tracking-widest">Available</span>
                    <span className="font-bold text-white">
                      {gBalance} <span className="text-neutral-500 font-medium">G$</span>
                    </span>
                  </div>

                  {/* Recipient */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest px-1">
                      Recipient
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Address (0x...)"
                        value={recipient}
                        onChange={(e) => { setRecipient(e.target.value); setSendError(""); }}
                        className="w-full px-5 py-4 bg-[#1a1a1a] border border-neutral-800 rounded-2xl outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono text-sm font-medium text-white placeholder:text-neutral-600 transition-all pr-14"
                      />
                      <button
                        onClick={handleScanQr}
                        disabled={isScanning}
                        title="Scan QR code"
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-xl hover:bg-neutral-800 text-neutral-500 hover:text-indigo-400 transition-colors disabled:opacity-40"
                      >
                        {isScanning
                          ? <Loader2 size={16} className="animate-spin" />
                          : <ScanLine size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">
                        Amount
                      </label>
                      <button
                        onClick={() => setSendAmount(gDollarBalance?.formatted ?? "")}
                        className="text-[10px] font-black text-indigo-400 uppercase tracking-widest"
                      >
                        Max: {gBalance} G$
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0.00"
                        value={sendAmount}
                        onChange={(e) => { setSendAmount(e.target.value); setSendError(""); }}
                        className="w-full px-5 py-5 bg-[#1a1a1a] border border-neutral-800 rounded-2xl outline-hidden focus:ring-1 focus:ring-indigo-500 font-bold text-3xl text-white placeholder:text-neutral-700 transition-all"
                      />
                    </div>
                  </div>

                  {sendError && (
                    <p className="text-xs font-bold text-red-400 px-1">{sendError}</p>
                  )}

                  <div className="pt-2 flex flex-col gap-4">
                    <button
                      onClick={handleSend}
                      disabled={isSending || isSendConfirming}
                      className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-base"
                    >
                      {isSending || isSendConfirming ? (
                        <Loader2 size={22} className="animate-spin" />
                      ) : (
                        <span>Send G$</span>
                      )}
                    </button>
                    <button
                      onClick={() => { setView("main"); setSendError(""); resetSend(); }}
                      className="text-xs font-bold text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-widest text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
