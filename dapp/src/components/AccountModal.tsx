"use client";

import { useState, useEffect, useRef } from "react";
import { useBalance, useWriteContract } from "wagmi";
import { usePrivy } from "@privy-io/react-auth";
import { useAuth } from "@/hooks/useAuth";
import {
  Copy,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
  Settings,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { parseUnits } from "viem";
import toast from "react-hot-toast";
import { GOOD_DOLLAR_ADDRESSES } from "@/config/contracts";
import { ERC20ABI } from "@/config/abi";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
  onOpenOnboarding?: () => void;
}

type ViewState = "overview" | "send" | "receive";

export function AccountModal({
  isOpen,
  onClose,
  onOpenProfile,
  onOpenOnboarding,
}: AccountModalProps) {
  const { address, logout } = useAuth();
  const { user, linkEmail, authenticated: privyAuthenticated } = usePrivy();
  const [isLinkingEmail, setIsLinkingEmail] = useState(false);

  const email = user?.email?.address ?? user?.google?.email ?? null;
  // Only offer email linking to Privy users who don't have one yet
  const canLinkEmail = privyAuthenticated && !email;

  const handleLinkEmail = async () => {
    setIsLinkingEmail(true);
    try {
      await linkEmail();
    } catch {
      // dismissed
    } finally {
      setIsLinkingEmail(false);
    }
  };
  const [view, setView] = useState<ViewState>("overview");
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const { data: celoBalance } = useBalance({ address });
  const { data: gBalance } = useBalance({
    address,
    token: GOOD_DOLLAR_ADDRESSES.CELO_MAINNET,
  });
  const { writeContract, isPending: isGSPending } = useWriteContract();

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  // Reset view when closed
  useEffect(() => {
    if (!isOpen) setView("overview");
  }, [isOpen]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success("Address copied!");
  };

  const handleLogout = async () => {
    onClose();
    await logout();
  };

  const handleSend = () => {
    if (!recipient || !amount) {
      toast.error("Please fill in all fields.");
      return;
    }
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
  };

  const formatAddress = (addr: string) =>
    `${addr.slice(0, 7)}...${addr.slice(-4)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="fixed top-[60px] left-3 right-3 sm:left-auto sm:right-10 lg:right-[80px] z-200 sm:w-[340px] bg-[#141414] rounded-2xl shadow-2xl overflow-hidden"
        >
          {view === "overview" && (
            <>
              {/* Address + email row */}
              <div className="flex items-start justify-between px-5 py-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-white font-mono text-base font-medium">
                    {address ? formatAddress(address) : "—"}
                  </span>
                  {email ? (
                    <span className="text-neutral-400 text-xs">{email}</span>
                  ) : canLinkEmail ? (
                    <button
                      onClick={handleLinkEmail}
                      disabled={isLinkingEmail}
                      className="text-xs text-amber-400 hover:text-amber-300 transition-colors text-left disabled:opacity-50 flex items-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                      {isLinkingEmail
                        ? "Opening…"
                        : "Link email to secure account"}
                    </button>
                  ) : null}
                </div>
                <button
                  onClick={copyAddress}
                  className="text-neutral-400 hover:text-white transition-colors mt-0.5"
                >
                  <Copy size={18} />
                </button>
              </div>

              <div className="border-t border-neutral-800" />

              {/* Balances */}
              <div className="px-5 py-1">
                {/* Celo */}
                <div className="flex items-center justify-between py-4 border-b border-neutral-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src="/celoicon.webp"
                        className="w-full h-full object-cover"
                        alt="Celo"
                      />
                    </div>
                    <span className="text-white font-medium">Celo</span>
                  </div>
                  <span className="text-white font-medium tabular-nums">
                    {celoBalance?.formatted?.slice(0, 6) ?? "0.00"}
                  </span>
                </div>

                {/* G$ */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-neutral-700 flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">G$</span>
                    </div>
                    <span className="text-white font-medium">G$</span>
                  </div>
                  <span className="text-white font-medium tabular-nums">
                    {gBalance?.formatted?.slice(0, 7) ?? "0.00"}
                  </span>
                </div>

                {/* Send / Receive */}
                <div className="grid grid-cols-2 gap-3 pb-4">
                  <button
                    onClick={() => setView("send")}
                    className="py-3 rounded-full bg-white hover:bg-neutral-100 text-black font-semibold text-sm transition-colors"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setView("receive")}
                    className="py-3 rounded-full bg-white hover:bg-neutral-100 text-black font-semibold text-sm transition-colors"
                  >
                    Receive
                  </button>
                </div>
              </div>

              <div className="border-t border-neutral-800" />

              {/* Footer actions */}
              <div className="px-5 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 py-3 text-red-500 hover:text-red-400 transition-colors text-sm"
                >
                  <LogOut size={17} className="text-red-500" />
                  Disconnect
                </button>
              </div>
            </>
          )}

          {view === "send" && (
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setView("overview")}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-white font-semibold">Send G$</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                  Recipient
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 outline-none focus:border-neutral-500 font-mono text-sm transition-colors"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <label className="text-xs text-neutral-500 uppercase tracking-widest font-bold">
                    Amount (G$)
                  </label>
                  <button
                    onClick={() => setAmount(gBalance?.formatted || "")}
                    className="text-xs text-neutral-400 hover:text-white transition-colors"
                  >
                    Max: {gBalance?.formatted?.slice(0, 7)}
                  </button>
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-neutral-500 outline-none focus:border-neutral-500 font-bold text-2xl transition-colors"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={isGSPending}
                className="w-full py-3.5 rounded-full bg-white hover:bg-neutral-100 text-black font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGSPending ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  "Send G$"
                )}
              </button>
            </div>
          )}

          {view === "receive" && (
            <div className="px-5 py-5 space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <button
                  onClick={() => setView("overview")}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <span className="text-white font-semibold">Receive</span>
              </div>

              <div className="bg-neutral-800 rounded-xl p-4">
                <p className="text-xs text-neutral-500 uppercase tracking-widest font-bold mb-2">
                  Your Address
                </p>
                <p className="text-white font-mono text-xs break-all leading-relaxed">
                  {address}
                </p>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(address || "");
                  toast.success("Address copied!");
                }}
                className="w-full py-3.5 rounded-full bg-white hover:bg-neutral-100 text-black font-bold transition-colors flex items-center justify-center gap-2"
              >
                <Copy size={16} />
                Copy Address
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
