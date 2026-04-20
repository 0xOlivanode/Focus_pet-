"use client";

import { ArrowRight, Zap, Trophy, Coins } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const STAGES = [
  { emoji: "🥚", name: "Egg",   threshold: "Start"   },
  { emoji: "🐣", name: "Baby",  threshold: "1 hr"    },
  { emoji: "🦖", name: "Teen",  threshold: "31 hrs"  },
  { emoji: "🐉", name: "Adult", threshold: "100 hrs" },
  { emoji: "👑", name: "Elder", threshold: "250 hrs" },
];

const FEATURES = [
  {
    icon: <Zap size={20} className="text-indigo-600 dark:text-indigo-400" />,
    title: "Focus Sessions",
    desc: "Pick 10, 25, or 45 minutes — or set your own. Every completed session feeds your pet, earns XP, and moves you up the board.",
  },
  {
    icon: <Coins size={20} className="text-emerald-600 dark:text-emerald-400" />,
    title: "Earn G$ Daily",
    desc: "Verified humans earn GoodDollar (G$) every day — real crypto UBI on Celo. Your focus sessions supercharge the flow.",
  },
  {
    icon: <Trophy size={20} className="text-yellow-500" />,
    title: "Compete Globally",
    desc: "Your pet's evolution is public proof of your discipline. Climb the leaderboard against focusers worldwide.",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Connect your wallet",
    desc: "Sign in with email or any Celo wallet. MiniPay users connect automatically — no extra steps.",
  },
  {
    num: "02",
    title: "Start a session",
    desc: "Pick a task, choose your duration, and commit. No multitasking. Your pet is watching.",
  },
  {
    num: "03",
    title: "Watch it grow",
    desc: "Each session earns XP and G$. Keep showing up and your egg hatches, evolves, and eventually becomes a legend.",
  },
];

export function LandingPage() {
  const { totalUsers, isLoading: leaderboardLoading } = useLeaderboard();
  const APP_URL =
    typeof window !== "undefined" && window.location.hostname === "focus-pet.xyz"
      ? "https://app.focus-pet.xyz"
      : "/app";

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white selection:bg-indigo-500/30 overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md border-b border-neutral-100 dark:border-neutral-900">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/focus-pet-logo.jpeg" alt="FocusPet" className="w-8 h-8 rounded-full shadow-sm" />
            <span className="font-black text-base tracking-tight">FocusPet</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={APP_URL}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
            >
              Go to App
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="pt-40 pb-24 px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="max-w-3xl mx-auto"
        >
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-6">
            Raise a pet by <br className="hidden sm:block" />
            doing the work.
          </h1>

          <p className="text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 mb-10 max-w-xl mx-auto leading-relaxed">
            FocusPet rewards every completed session with XP and{" "}
            <strong className="text-neutral-700 dark:text-neutral-200">GoodDollar (G$)</strong>
            {" "}— daily crypto earned on Celo. The more you focus, the more your pet evolves.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Link
              href={APP_URL}
              className="group flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
            >
              Start for Free
              <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Pet evolution strip */}
          <div className="relative flex items-end justify-center">
            <div className="absolute top-7 left-1/2 -translate-x-1/2 w-[72%] h-px bg-neutral-100 dark:bg-neutral-800" />
            {STAGES.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.07 }}
                className="relative flex flex-col items-center gap-2 px-3 sm:px-5"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl z-10
                  ${i === 0
                    ? "bg-white dark:bg-neutral-900 border-2 border-indigo-200 dark:border-indigo-800 shadow-sm"
                    : "bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800"
                  }`}
                >
                  {s.emoji}
                </div>
                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">{s.name}</span>
                <span className="text-[9px] font-medium text-neutral-300 dark:text-neutral-600">{s.threshold}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Stats bar ───────────────────────────────────── */}
      <section className="bg-neutral-950 dark:bg-neutral-900 border-y border-neutral-900">
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3">
          <Stat value={leaderboardLoading ? "—" : `${totalUsers.toLocaleString()}+`} label="Focusers" />
          <div className="w-px h-6 bg-neutral-800 hidden sm:block" />
          <Stat value="Celo Mainnet" label="Network" />
          <div className="w-px h-6 bg-neutral-800 hidden sm:block" />
          <Stat value="GoodDollar" label="Daily Reward" />
          <div className="w-px h-6 bg-neutral-800 hidden sm:block" />
          <Stat value="MiniPay" label="Mini App" />
        </div>
      </section>

      {/* ── Features ────────────────────────────────────── */}
      <section className="py-24 px-5">
        <div className="max-w-[1200px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
              Why FocusPet?
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto text-sm sm:text-base">
              Productivity apps fail because they give you nothing to come back for. FocusPet fixes that.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="p-6 rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 flex items-center justify-center mb-5 shadow-sm">
                  {f.icon}
                </div>
                <h3 className="font-black text-base mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="py-24 px-5 bg-neutral-50/60 dark:bg-neutral-900/40 border-y border-neutral-100 dark:border-neutral-800/50">
        <div className="max-w-[680px] mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
              Three steps to your first XP
            </h2>
          </motion.div>

          <div className="space-y-5">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
                className="flex items-start gap-5 p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800"
              >
                <span className="shrink-0 font-black text-2xl text-neutral-200 dark:text-neutral-700 tabular-nums leading-none pt-0.5">
                  {s.num}
                </span>
                <div>
                  <h3 className="font-black text-base mb-1">{s.title}</h3>
                  <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="py-28 px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="max-w-xl mx-auto"
        >
          <div className="text-5xl mb-6">🥚</div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
            Your pet is waiting to hatch.
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mb-8 leading-relaxed">
            Every minute you focus, your egg is growing. What are you waiting for?
          </p>
          <Link
            href={APP_URL}
            className="group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Hatch Your Pet
            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-neutral-100 dark:border-neutral-800/50 py-8 px-5">
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/focus-pet-logo.jpeg" alt="FocusPet" className="w-6 h-6 rounded-full" />
            <span className="font-black text-sm text-neutral-500">FocusPet</span>
          </div>
          <p className="text-xs text-neutral-400">Built on Celo · Powered by GoodDollar</p>
        </div>
      </footer>

    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="font-black text-base text-white">{value}</span>
      <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">{label}</span>
    </div>
  );
}
