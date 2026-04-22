"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, ShieldCheck } from "lucide-react";
import { createPortal } from "react-dom";

interface BoostsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  boostEndTime: number;   // unix seconds, 0 = inactive
  shieldCount: number;
}

function useCountdown(endTimeSec: number) {
  const [remaining, setRemaining] = useState(() => Math.max(0, endTimeSec - Math.floor(Date.now() / 1000)));

  useEffect(() => {
    if (endTimeSec <= 0) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, endTimeSec - Math.floor(Date.now() / 1000)));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [endTimeSec]);

  return remaining;
}

function formatCountdown(sec: number) {
  if (sec <= 0) return "Expired";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m remaining`;
  if (m > 0) return `${m}m ${s}s remaining`;
  return `${s}s remaining`;
}

function BoostRow({
  icon,
  name,
  description,
  active,
  expiresAt,
  count,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  active: boolean;
  expiresAt?: number;
  count?: number;
}) {
  const remaining = useCountdown(expiresAt ?? 0);

  return (
    <div className={`flex items-center gap-4 px-5 py-4 rounded-2xl border transition-colors ${
      active
        ? "bg-[#1a1a1a] border-neutral-700"
        : "bg-[#111111] border-neutral-800 opacity-50"
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        active ? "bg-white/10 border border-white/20" : "bg-neutral-800 border border-neutral-700"
      }`}>
        <div className={active ? "text-white" : "text-neutral-600"}>{icon}</div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white text-sm font-medium">{name}</p>
          {count !== undefined && count > 0 && (
            <span className="text-[11px] font-medium px-2 py-0.5 bg-white/10 rounded-full text-neutral-300">
              ×{count}
            </span>
          )}
          {!active && (
            <span className="text-[11px] font-medium px-2 py-0.5 bg-neutral-800 rounded-full text-neutral-600">
              Inactive
            </span>
          )}
        </div>
        <p className="text-neutral-500 text-xs mt-0.5">{description}</p>
      </div>

      {active && expiresAt && expiresAt > 0 && (
        <div className="shrink-0 text-right">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
            <span className="text-white text-xs tabular-nums font-medium">
              {formatCountdown(remaining)}
            </span>
          </div>
        </div>
      )}

      {active && count !== undefined && (
        <div className="shrink-0">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-white"
          />
        </div>
      )}
    </div>
  );
}

export function BoostsSheet({ isOpen, onClose, boostEndTime, shieldCount }: BoostsSheetProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const isBoostActive = boostEndTime > Math.floor(Date.now() / 1000);
  const hasAnyActive = isBoostActive || shieldCount > 0;

  const sheet = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-xs"
          />

          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="relative w-full max-w-full lg:max-w-[960px] mx-auto bg-[#111111] rounded-t-[2rem] overflow-hidden"
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-4 pb-1">
              <div className="w-10 h-1 rounded-full bg-neutral-700" />
            </div>

            <div className="px-6 pt-4 pb-10">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-white text-xl font-semibold leading-tight">Active Boosts</h2>
                  <p className="text-neutral-500 text-sm mt-1">
                    {hasAnyActive ? "You have active boosts running." : "No boosts active right now."}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 transition-colors shrink-0 ml-4 mt-0.5"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <BoostRow
                  icon={<Zap className="w-4 h-4" />}
                  name="XP Boost"
                  description="2× XP on all focus sessions for 24 hours."
                  active={isBoostActive}
                  expiresAt={isBoostActive ? boostEndTime : undefined}
                />
                <BoostRow
                  icon={<ShieldCheck className="w-4 h-4" />}
                  name="Streak Shield"
                  description="Protects your streak from breaking if you miss a day."
                  active={shieldCount > 0}
                  count={shieldCount > 0 ? shieldCount : undefined}
                />
              </div>

              {!hasAnyActive && (
                <p className="text-center text-neutral-600 text-xs mt-6 leading-relaxed">
                  Visit the Shop to pick up Energy Drinks and Streak Shields.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(sheet, document.body);
}
