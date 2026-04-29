"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldCheck, ShieldAlert, Loader2, BadgeCheck, ExternalLink } from "lucide-react";

interface IdentityModalProps {
  isOpen: boolean;
  onClose: () => void;
  fvLink: string | null;
  status: "verified" | "not_verified" | "loading" | "error";
  onRefresh: () => void;
}

export function IdentityModal({
  isOpen,
  onClose,
  fvLink,
  status,
  onRefresh,
}: IdentityModalProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  useEffect(() => {
    setIframeLoaded(false);
  }, [fvLink]);

  useEffect(() => {
    if (status === "verified" && isOpen) {
      setTimeout(() => onClose(), 2000);
    }
  }, [status, isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-3xl h-[85vh] bg-[#111111] rounded-3xl border border-neutral-800 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#1a1a1a] border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-300">
                <ShieldCheck size={18} />
              </div>
              <h2 className="text-white font-medium tracking-tight">
                Human Verification
              </h2>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 relative bg-[#0d0d0d]">
            {status === "verified" ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="w-20 h-20 bg-[#1a1a1a] border border-neutral-800 rounded-full flex items-center justify-center text-white mb-6"
                >
                  <BadgeCheck size={36} />
                </motion.div>
                <h3 className="text-2xl font-medium text-white mb-2 tracking-tight">
                  Identity Confirmed
                </h3>
                <p className="text-neutral-500 text-sm max-w-sm leading-relaxed">
                  You are now a verified Focuser. Your G$ rewards are unlocking.
                </p>
              </div>
            ) : fvLink ? (
              <div className="w-full h-full flex flex-col">
                <div className="flex-1 relative">
                  {!iframeLoaded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 rounded-full border-2 border-transparent border-t-white/40 animate-spin" />
                      <span className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest text-center px-6">
                        Initializing secure face verification…
                      </span>
                    </div>
                  )}
                  <iframe
                    src={fvLink}
                    className={`w-full h-full border-0 transition-opacity duration-700 ${
                      iframeLoaded ? "opacity-100" : "opacity-0"
                    }`}
                    onLoad={() => setIframeLoaded(true)}
                    allow="camera"
                  />
                </div>

                {/* Fallback footer */}
                <div className="px-5 py-3 bg-[#111111] border-t border-neutral-800 flex items-center justify-between gap-4">
                  <p className="text-[10px] font-semibold text-neutral-600 uppercase tracking-widest">
                    Having trouble with the camera?
                  </p>
                  <a
                    href={fvLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#222222] border border-neutral-800 text-neutral-300 hover:text-white rounded-full text-xs font-medium transition-colors"
                  >
                    Open in New Tab
                    <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-16 h-16 bg-[#1a1a1a] border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-400 mb-6">
                  <ShieldAlert size={28} />
                </div>
                <h3 className="text-xl font-medium text-white mb-2 tracking-tight">
                  Synchronizing Portal
                </h3>
                <p className="text-neutral-500 text-sm max-w-xs mb-8 leading-relaxed">
                  Establishing a secure connection to the GoodDollar Identity
                  protocol. This ensures your verification is private and
                  tamper-proof.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-[200px]">
                  <button
                    onClick={onRefresh}
                    className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-neutral-100 text-black rounded-full text-sm font-semibold transition-all active:scale-[0.98]"
                  >
                    <Loader2 size={14} className="animate-spin" />
                    Retry Connection
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-[#1a1a1a] hover:bg-[#222222] border border-neutral-800 text-neutral-400 hover:text-white rounded-full text-sm font-medium transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-neutral-800 flex items-center justify-center">
            <p className="text-[11px] text-neutral-600 tracking-tight text-center">
              FocusPet integrates with GoodDollar for decentralized, privacy-focused identity verification
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
