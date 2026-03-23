"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus } from "lucide-react";

const STORAGE_KEY = "ios-install-prompt-dismissed";

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  if (typeof window === "undefined") return false;
  // iOS Safari sets this when launched from home screen
  return (window.navigator as any).standalone === true;
}

export function IOSInstallPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isIOS()) return;
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Delay slightly so it doesn't flash immediately on load
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
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-[300] p-4 pb-safe"
        >
          <div className="relative bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-2xl p-6 max-w-sm mx-auto">
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-start gap-4">
              {/* App icon */}
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/focus-pet.png"
                  alt="FocusPet"
                  className="w-10 h-10 object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-neutral-900 dark:text-white leading-tight mb-1">
                  Install FocusPet
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Add to your home screen to get push notifications when your
                  pet needs you.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              {/* Step 1 */}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <Share size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Tap the{" "}
                  <span className="font-black text-indigo-600 dark:text-indigo-400">
                    Share
                  </span>{" "}
                  button in Safari's toolbar
                </p>
              </div>

              {/* Step 2 */}
              <div className="flex items-center gap-3 px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 rounded-xl">
                <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                  <Plus size={14} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Select{" "}
                  <span className="font-black text-indigo-600 dark:text-indigo-400">
                    Add to Home Screen
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={dismiss}
              className="mt-4 w-full py-2.5 text-xs font-black uppercase tracking-widest text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
