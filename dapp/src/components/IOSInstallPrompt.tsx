"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus } from "lucide-react";
import Image from "next/image";

const STORAGE_KEY = "ios-install-prompt-dismissed";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  return (window.navigator as any).standalone === true;
}

function isMiniPay(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).ethereum?.isMiniPay;
}

export function IOSInstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isMiniPay()) return;
    if (!isIOS()) return;
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const timer = setTimeout(() => setVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismiss}
            className="fixed inset-0 z-[299] bg-black/60"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 40 }}
            className="fixed bottom-0 left-0 right-0 z-[300] pb-safe"
          >
            <div className="bg-[#111111] border-t border-neutral-800 rounded-t-3xl px-6 pt-5 pb-8 max-w-lg mx-auto">
              {/* Handle */}
              <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mb-6" />

              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#1a1a1a] border border-neutral-800 overflow-hidden flex items-center justify-center shrink-0">
                    <Image
                      src="/focus-pet.png"
                      width={32}
                      height={32}
                      alt="FocusPet"
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">
                      Install FocusPet
                    </p>
                    <p className="text-neutral-500 text-xs mt-0.5">
                      Add to your home screen
                    </p>
                  </div>
                </div>
                <button
                  onClick={dismiss}
                  className="w-7 h-7 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
                >
                  <X size={13} />
                </button>
              </div>

              {/* Description */}
              <p className="text-neutral-500 text-sm leading-relaxed mb-5">
                Get push notifications when your pet needs you — add FocusPet to your home screen in two taps.
              </p>

              {/* Steps */}
              <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] border border-neutral-800 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-[#222222] border border-neutral-700 flex items-center justify-center shrink-0">
                    <Share size={13} className="text-neutral-300" />
                  </div>
                  <p className="text-sm text-neutral-300">
                    Tap{" "}
                    <span className="text-white font-semibold">Share</span>{" "}
                    in Safari's toolbar
                  </p>
                </div>

                <div className="flex items-center gap-3 px-4 py-3 bg-[#1a1a1a] border border-neutral-800 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-[#222222] border border-neutral-700 flex items-center justify-center shrink-0">
                    <Plus size={13} className="text-neutral-300" />
                  </div>
                  <p className="text-sm text-neutral-300">
                    Select{" "}
                    <span className="text-white font-semibold">
                      Add to Home Screen
                    </span>
                  </p>
                </div>
              </div>

              {/* Dismiss */}
              <button
                onClick={dismiss}
                className="w-full py-3 rounded-full bg-[#1a1a1a] hover:bg-[#222222] border border-neutral-800 text-neutral-500 hover:text-neutral-300 text-sm font-medium transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
