"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Info, X, Sparkles } from "lucide-react";
import { SocialShare } from "./SocialShare";

export type ToastType = "success" | "info" | "error" | "achievement";

interface NotificationToastProps {
  isVisible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: ToastType;
  duration?: number;
  showShare?: boolean;
  shareText?: string;
}

export function NotificationToast({
  isVisible,
  onClose,
  title,
  message,
  type = "success",
  duration = 5000,
  showShare = false,
  shareText = "",
}: NotificationToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const icons = {
    success: <CheckCircle2 className="text-emerald-500" size={20} />,
    info: <Info className="text-indigo-500" size={20} />,
    error: <X className="text-red-500" size={20} />,
    achievement: <Sparkles className="text-amber-500" size={20} />,
  };

  const colors = {
    success: "border-emerald-500/20 bg-emerald-500/5",
    info: "border-indigo-500/20 bg-indigo-500/5",
    error: "border-red-500/20 bg-red-500/5",
    achievement: "border-amber-500/20 bg-amber-500/5",
  };

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4 pointer-events-none">
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: -40, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={`pointer-events-auto relative overflow-hidden backdrop-blur-xl border p-4 rounded-3xl shadow-2xl flex items-start gap-4 ${colors[type]}`}
          >
            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-linear-to-br from-white/10 to-transparent pointer-none" />

            <div className="shrink-0 mt-0.5">{icons[type]}</div>

            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-black tracking-tight mb-0.5 dark:text-white">
                {title}
              </h3>
              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 leading-relaxed">
                {message}
              </p>

              {showShare && (
                <div className="mt-3 flex justify-start">
                  <SocialShare
                    text={shareText}
                    className="!w-auto !h-auto px-4 py-1.5 rounded-xl !bg-indigo-600 !text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                  />
                </div>
              )}
            </div>

            <button
              onClick={onClose}
              className="shrink-0 p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
