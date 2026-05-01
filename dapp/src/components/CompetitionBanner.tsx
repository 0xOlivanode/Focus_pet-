"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, ArrowRight, Clock } from "lucide-react";
import { COMPETITION, getCompetitionStatus, type CompetitionStatus } from "@/config/competition";

function useCountdownShort(targetTs: number) {
  const calc = () => {
    const diff = Math.max(0, targetTs - Math.floor(Date.now() / 1000));
    return {
      days: Math.floor(diff / 86400),
      hours: Math.floor((diff % 86400) / 3600),
      minutes: Math.floor((diff % 3600) / 60),
      seconds: diff % 60,
    };
  };
  const [t, setT] = useState(calc);
  useEffect(() => {
    const id = setInterval(() => setT(calc()), 1000);
    return () => clearInterval(id);
  }, [targetTs]);
  return t;
}

export function CompetitionBanner() {
  const router = useRouter();
  const [status, setStatus] = useState<CompetitionStatus>(getCompetitionStatus);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => setStatus(getCompetitionStatus()), 30_000);
    return () => clearInterval(id);
  }, []);

  const target = status === "upcoming" ? COMPETITION.startTs : COMPETITION.endTs;
  const t = useCountdownShort(target);

  if (!mounted || status === "ended") return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => router.push("/app/competition")}
      className="w-full mb-6 rounded-3xl overflow-hidden relative group cursor-pointer text-left active:scale-[0.99] transition-transform"
    >
      {/* Gold → mint gradient border via wrapper */}
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-[#C48E57]/30 via-transparent to-[#01FF8B]/30 p-px">
        <div className="absolute inset-[1px] rounded-3xl bg-[#0c0c0c]" />
      </div>

      {/* Content */}
      <div className="relative bg-[#0c0c0c] rounded-3xl px-5 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Label row */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-[#C48E57]/10 border border-[#C48E57]/20 px-2.5 py-1 rounded-full">
                <Zap size={10} className="text-[#C48E57]" fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#C48E57]">
                  Focus Blitz
                </span>
              </div>

              {status === "live" && (
                <div className="flex items-center gap-1 bg-[#01FF8B12] border border-[#01FF8B]/20 px-2.5 py-1 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#01FF8B] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#01FF8B]">
                    Live now
                  </span>
                </div>
              )}
            </div>

            {/* Title */}
            <p className="text-white font-black text-base leading-tight mb-1">
              {status === "live"
                ? "Competition is live — go focus!"
                : "Competition starts soon"}
            </p>

            {/* Countdown */}
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Clock size={11} />
              {status === "live" ? (
                <span>
                  Ends in{" "}
                  <span className="text-[#A9A9A9] font-semibold tabular-nums">
                    {t.days > 0 && `${t.days}d `}{t.hours}h {t.minutes}m
                  </span>
                </span>
              ) : (
                <span>
                  Starts in{" "}
                  <span className="text-[#A9A9A9] font-semibold tabular-nums">
                    {t.days > 0 && `${t.days}d `}{t.hours}h {t.minutes}m {t.seconds}s
                  </span>
                </span>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="shrink-0">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-[#C48E57] to-[#d4a26a] text-black px-4 py-2.5 rounded-full font-black text-xs group-hover:brightness-110 transition-all">
              {status === "live" ? "Join" : "Preview"}
              <ArrowRight size={12} />
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
