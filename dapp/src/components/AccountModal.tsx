"use client";

import { useState } from "react";
import {
  useAccount,
  useBalance,
  useSendTransaction,
  useWriteContract,
} from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import {
  X,
  Copy,
  Send,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Mail,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseEther, parseUnits } from "viem";
import toast from "react-hot-toast";
import { GOOD_DOLLAR_ADDRESSES } from "@/config/contracts";
import { ERC20ABI, FocusPetABI } from "@/config/abi";
import { useFocusPet } from "@/hooks/useFocusPet";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewState = "overview" | "send" | "receive";

export function AccountModal({ isOpen, onClose }: AccountModalProps) {
  const { address } = useAccount();
  const { user, logout } = usePrivy();
  const [view, setView] = useState<ViewState>("overview");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<"CELO" | "G$">("CELO");
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const { deleteUser, isProcessing } = useFocusPet();

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const { data: celoBalance } = useBalance({ address });
  const { data: gBalance } = useBalance({
    address,
    token: GOOD_DOLLAR_ADDRESSES.CELO_MAINNET,
  });

  const { sendTransaction, isPending: isCeloPending } = useSendTransaction();
  const { writeContract, isPending: isGSPending } = useWriteContract();

  const handleSend = async () => {
    if (!recipient || !amount) {
      toast.error("Please fill in all fields.");
      return;
    }

    try {
      if (selectedToken === "CELO") {
        sendTransaction(
          {
            to: recipient as `0x${string}`,
            value: parseEther(amount),
          },
          {
            onSuccess: () => {
              toast.success("Transaction sent!");
              setView("overview");
              setAmount("");
              setRecipient("");
            },
            onError: (err) => toast.error(err.message),
          },
        );
      } else {
        writeContract(
          {
            address: GOOD_DOLLAR_ADDRESSES.CELO_MAINNET,
            abi: ERC20ABI,
            functionName: "transfer",
            args: [recipient as `0x${string}`, parseUnits(amount, 18)],
          },
          {
            onSuccess: () => {
              toast.success("G$ sent!");
              setView("overview");
              setAmount("");
              setRecipient("");
            },
            onError: (err) => toast.error(err.message),
          },
        );
      }
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-[500px] bg-white dark:bg-neutral-900 rounded-[40px] shadow-2xl overflow-hidden"
          >
            {/* Header Area */}
            <div className="pt-10 pb-4 flex flex-col items-center gap-4">
              <img
                src="/focus-pet-logo.jpeg"
                className="w-12 h-12 rounded-full shadow-md border border-neutral-100 dark:border-neutral-800"
                alt="FocusPet"
              />
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                {view === "overview"
                  ? "Your Account"
                  : view === "send"
                    ? "Send Assets"
                    : "Receive Assets"}
              </h2>
              <button
                onClick={onClose}
                className="absolute right-6 top-6 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={18} className="text-neutral-400" />
              </button>
            </div>

            <div className="px-6 pb-10">
              {view === "overview" && (
                <div className="space-y-3">
                  {/* ID Section matching Privy List Style */}
                  <div className="space-y-2 mb-6">
                    {/* Address Item */}
                    <button
                      onClick={() => copyToClipboard(address || "", "Address")}
                      className="w-full flex items-center justify-between p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-left">
                          <div className="text-xs text-neutral-400 uppercase tracking-widest">
                            Wallet Address
                          </div>
                          <div className="text-neutral-900 dark:text-white">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </div>
                        </div>
                      </div>
                      <Copy
                        size={16}
                        className="text-neutral-300 group-hover:text-indigo-500 transition-colors"
                      />
                    </button>

                    {/* Email Item */}
                    {user?.email && (
                      <div className="w-full flex items-center justify-between p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900">
                        <div className="flex items-center gap-3">
                          <div className="text-left">
                            <div className="text-xs text-neutral-400 uppercase tracking-widest">
                              Connected Email
                            </div>
                            <div className=" text-neutral-900 dark:text-white">
                              {user.email.address}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Balance Section */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Celo Card */}
                    <div className="p-4 rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                      <div className="flex items-center gap-2 mb-3">
                        <img
                          src="/celoicon.webp"
                          className="w-5 h-5 rounded-full"
                          alt="Celo"
                        />
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                          Celo
                        </span>
                      </div>
                      <div className="font-bold text-lg text-neutral-900 dark:text-white">
                        {celoBalance?.formatted?.slice(0, 6) || "0.00"}
                      </div>
                    </div>

                    {/* G$ Card */}
                    <div className="p-4 rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-black">
                          G
                        </div>
                        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                          G$
                        </span>
                      </div>
                      <div className="font-bold text-lg text-neutral-900 dark:text-white">
                        {gBalance?.formatted?.slice(0, 7) || "0.00"}
                      </div>
                    </div>
                  </div>

                  {/* Primary Actions */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <button
                      onClick={() => setView("send")}
                      className="py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowUpRight size={18} />
                      Send
                    </button>
                    <button
                      onClick={() => setView("receive")}
                      className="py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <ArrowDownLeft size={18} />
                      Receive
                    </button>
                  </div>

                  <div className="pt-6 flex flex-col items-center gap-3">
                    {/* <AnimatePresence mode="wait">
                      {!showResetConfirm ? (
                        <motion.button
                          key="reset-init"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          onClick={() => setShowResetConfirm(true)}
                          className="text-[10px] font-black text-neutral-400 hover:text-red-500 transition-colors uppercase tracking-[0.2em] flex items-center gap-2"
                        >
                          <RotateCcw size={12} />
                          Reset Pet Data
                        </motion.button>
                      ) : (
                        <motion.div
                          key="reset-confirm"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex flex-col items-center gap-2"
                        >
                          <p className="text-[10px] font-black text-red-500 uppercase tracking-widest text-center max-w-[200px]">
                            Are you sure? This will delete your pet permanently.
                          </p>
                          <div className="flex gap-4">
                            <button
                              disabled={isProcessing}
                              onClick={() => {
                                deleteUser();
                                setShowResetConfirm(false);
                                toast.success("Reset request sent!");
                              }}
                              className="text-[10px] font-black text-red-600 hover:underline uppercase tracking-widest"
                            >
                              {isProcessing ? "Processing..." : "Yes, Delete"}
                            </button>
                            <button
                              onClick={() => setShowResetConfirm(false)}
                              className="text-[10px] font-black text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 uppercase tracking-widest"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence> */}

                    <button
                      onClick={handleLogout}
                      className="text-[10px] font-black text-neutral-400/60 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors uppercase tracking-[0.2em] mt-2"
                    >
                      Log Out
                    </button>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-300 uppercase tracking-widest">
                      <span>Protected by</span>
                      <div className="flex items-center gap-1 text-neutral-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />
                        privy
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {view === "send" && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  {/* Back button is already in header, so we focus on form */}
                  <div className="space-y-4">
                    <div className="flex gap-2 p-1.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                      {["CELO", "G$"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedToken(t as any)}
                          className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm tracking-widest ${selectedToken === t ? "bg-white dark:bg-neutral-900 text-indigo-600 shadow-sm border border-neutral-100 dark:border-neutral-700" : "text-neutral-400"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest px-1">
                        Recipient
                      </label>
                      <input
                        type="text"
                        placeholder="Address or ENS (0x...)"
                        className="w-full px-5 py-4 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium transition-all"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between px-1">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                          Amount
                        </label>
                        <button
                          onClick={() =>
                            setAmount(
                              selectedToken === "CELO"
                                ? celoBalance?.formatted || ""
                                : gBalance?.formatted || "",
                            )
                          }
                          className="text-[10px] font-black text-indigo-500 uppercase tracking-widest"
                        >
                          Max:{" "}
                          {selectedToken === "CELO"
                            ? celoBalance?.formatted?.slice(0, 6)
                            : gBalance?.formatted?.slice(0, 7)}
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0.00"
                          className="w-full px-5 py-5 bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-2xl outline-hidden focus:ring-1 focus:ring-indigo-500 font-bold text-3xl transition-all"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col gap-4">
                    <button
                      onClick={handleSend}
                      disabled={isCeloPending || isGSPending}
                      className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-lg shadow-lg shadow-indigo-100 dark:shadow-none"
                    >
                      {isCeloPending || isGSPending ? (
                        <Loader2 size={24} className="animate-spin" />
                      ) : (
                        <span>Send {selectedToken}</span>
                      )}
                    </button>
                    <button
                      onClick={() => setView("overview")}
                      className="text-xs font-bold text-neutral-400 hover:text-neutral-600 transition-colors uppercase tracking-widest text-center"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}

              {view === "receive" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8 text-center"
                >
                  <div className="bg-white dark:bg-neutral-900 rounded-[40px] p-6 border border-neutral-100 dark:border-neutral-800 shadow-xs flex flex-col items-center gap-6">
                    <div className="w-48 h-48 bg-neutral-50 dark:bg-neutral-800 rounded-3xl flex items-center justify-center relative group p-4 border border-neutral-100 dark:border-neutral-700">
                      <div className="grid grid-cols-4 gap-2 opacity-10">
                        {[...Array(16)].map((_, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 bg-black dark:bg-white rounded-md"
                          />
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ArrowDownLeft size={48} className="text-neutral-200" />
                      </div>
                    </div>

                    <div className="w-full space-y-1">
                      <div className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">
                        Your Receive Address
                      </div>
                      <div className="text-sm font-mono break-all text-neutral-900 dark:text-white bg-neutral-50 dark:bg-neutral-800 px-4 py-3 rounded-xl border border-neutral-100 dark:border-neutral-700">
                        {address}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button
                      onClick={() => copyToClipboard(address || "", "Address")}
                      className="w-full h-16 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    >
                      <Copy size={20} />
                      Copy Address
                    </button>
                    <button
                      onClick={() => setView("overview")}
                      className="text-xs font-bold text-neutral-400 hover:text-neutral-600 transition-colors uppercase tracking-widest"
                    >
                      Back to Wallet
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* View switcher logic: Override header back button logic per view */}
            {view !== "overview" && (
              <style
                dangerouslySetInnerHTML={{
                  __html: `
                #modal-back-btn { display: flex !important; }
             `,
                }}
              />
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
