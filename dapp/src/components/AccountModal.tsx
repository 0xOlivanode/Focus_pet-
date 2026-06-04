"use client";

import { useState, useEffect, useRef } from "react";
import { useBalance } from "wagmi";
import { useAuth } from "@/hooks/useAuth";
import {
  Copy,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile?: () => void;
  onOpenOnboarding?: () => void;
  hasPet?: boolean;
}

type ViewState = "overview" | "receive";

export function AccountModal({
  isOpen,
  onClose,
  onOpenProfile,
  onOpenOnboarding,
  hasPet = false,
}: AccountModalProps) {
  const { address, logout } = useAuth();
  const [view, setView] = useState<ViewState>("overview");
  const ref = useRef<HTMLDivElement>(null);

  const { data: celoBalance } = useBalance({ address });

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
              {/* Address row */}
              <div className="flex items-start justify-between px-5 py-4">
                <span className="text-white font-mono text-base font-medium">
                  {address ? formatAddress(address) : "—"}
                </span>
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

                <div className="grid grid-cols-1 gap-3 py-4">
                  <button
                    onClick={() => setView("receive")}
                    className="py-3 rounded-full bg-white hover:bg-neutral-100 text-black font-semibold text-sm transition-colors"
                  >
                    Receive
                  </button>
                </div>
              </div>

              <div className="border-t border-neutral-800" />

              <div className="px-5 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 py-3 text-red-500 hover:text-red-400 transition-colors text-sm"
                >
                  <LogOut size={17} className="text-red-500" />
                  Logout
                </button>
              </div>
            </>
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
