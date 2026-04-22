"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Coins,
  ArrowRight,
  Heart,
  ShoppingBag,
  ShieldCheck,
  Trophy,
  Star,
  Globe,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";

const sections = [
  {
    id: "core",
    nav: "The core loop",
    title: "Focus. Earn. Evolve.",
    description:
      "FocusPet turns your deep work into a living creature. Complete focus sessions to hatch your egg, earn real G$ crypto, and evolve your pet from a baby all the way to an Elder.",
    stats: [
      { icon: Zap, label: "10 min minimum to earn XP" },
      { icon: Coins, label: "G$ is real GoodDollar cryptocurrency" },
      { icon: ArrowRight, label: "5 evolution stages to unlock" },
    ],
  },
  {
    id: "consistent",
    nav: "Stay consistent",
    title: "Your Pet Can Die",
    description:
      "Health decays every day you don't focus. Hit 0% and your pet dies — you'll need to spend G$ to revive it. Stay consistent or keep it fed to stay alive.",
    stats: [
      { icon: Heart, label: "Health drops daily without sessions" },
      { icon: ShoppingBag, label: "Buy Food from the Shop to heal" },
      { icon: ShieldCheck, label: "Shields block decay for 24h" },
    ],
  },
  {
    id: "gains",
    nav: "Max your gains",
    title: "Supercharge Mode",
    description:
      "Stream G$ to the GoodDollar UBI pool to unlock God Mode — your pet gets 100% health stability and up to a 2x XP multiplier. The more you stream, the bigger the boost.",
    stats: [
      { icon: Zap, label: "Up to 2.0x XP on every session" },
      { icon: Heart, label: "Auto-heals your pet to 100%" },
      { icon: ArrowRight, label: "Stop any time, no lock-in" },
    ],
  },
  {
    id: "compete",
    nav: "Compete globally",
    title: "Climb the Leaderboard",
    description:
      "Every session earns XP that pushes you up the global leaderboard. Compete with Focusers worldwide — your rank, streak, and pet stage are all visible to everyone.",
    stats: [
      { icon: Trophy, label: "Live rankings updated in real-time" },
      { icon: ShieldCheck, label: "Verified badge for top credibility" },
      { icon: Zap, label: "Streaks shown on your public profile" },
    ],
  },
  {
    id: "impact",
    nav: "Real world impact",
    title: "Your Focus Feeds the World",
    description:
      "Every minute you focus contributes to the GoodDollar UBI pool — a real fund that distributes basic income to people in need globally. Productivity with purpose.",
    stats: [
      { icon: Globe, label: "G$ reaches people in 180+ countries" },
      { icon: ShieldCheck, label: "Verify identity to unlock more rewards" },
      { icon: Heart, label: "Your streak = your contribution streak" },
    ],
  },
];

export default function GuidePage() {
  const [active, setActive] = useState(0);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navRef = useRef<HTMLDivElement>(null);
  const [connectorTop, setConnectorTop] = useState(0);
  const [connectorHeight, setConnectorHeight] = useState(0);

  useEffect(() => {
    const btn = buttonRefs.current[active];
    const nav = navRef.current;
    if (!btn || !nav) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setConnectorTop(btnRect.top - navRect.top);
    setConnectorHeight(btnRect.height);
  }, [active]);

  // Measure on mount too (layout may shift)
  useEffect(() => {
    const btn = buttonRefs.current[0];
    const nav = navRef.current;
    if (!btn || !nav) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setConnectorTop(btnRect.top - navRect.top);
    setConnectorHeight(btnRect.height);
  }, []);

  const section = sections[active];

  return (
    <div className="min-h-screen bg-black">
      <Navbar />

      <main className="px-5 sm:px-10 lg:px-[80px] py-10 sm:py-14">
        <h1 className="text-white text-4xl sm:text-5xl font-bold mb-10 sm:mb-12">
          Guide
        </h1>

        {/* Desktop layout */}
        <div className="hidden md:flex items-start">
          {/* Left nav */}
          <div
            ref={navRef}
            className="relative flex flex-col gap-3 shrink-0 w-[190px]"
          >
            {sections.map((s, i) => (
              <button
                key={s.id}
                ref={(el) => {
                  buttonRefs.current[i] = el;
                }}
                onClick={() => setActive(i)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all text-left whitespace-nowrap ${
                  active === i
                    ? "bg-white text-black"
                    : "bg-[#1a1a1a] text-neutral-400 hover:text-neutral-300"
                }`}
              >
                {s.nav}
              </button>
            ))}
          </div>

          {/* Dashed connector */}
          <div className="relative w-14 shrink-0 self-stretch">
            <motion.div
              className="absolute left-0 border-l border-t border-b border-dashed border-neutral-700"
              style={{ width: "100%" }}
              animate={{ top: connectorTop, height: connectorHeight }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
            />
          </div>

          {/* Content card */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="bg-[#111111] rounded-2xl p-8 lg:p-10 flex gap-10"
              >
                {/* Text side */}
                <div className="flex-1 max-w-[376px] flex flex-col justify-center">
                  <h2 className="text-white text-2xl xl:text-3xl font-semibold mb-4 leading-tight">
                    {section.title}
                  </h2>
                  <p className="text-neutral-400 text-sm xl:text-base leading-relaxed">
                    {section.description}
                  </p>
                </div>

                {/* Stats side */}
                <div className="flex flex-col gap-6 w-[180px] xl:w-[210px] shrink-0 justify-center">
                  {section.stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={i}
                        className="flex flex-col items-center gap-2.5"
                      >
                        <div className="w-16 h-16 xl:w-20 xl:h-20 rounded-full bg-neutral-800 flex items-center justify-center">
                          <Icon size={22} className="text-neutral-400" />
                        </div>
                        <p className="text-neutral-400 text-xs xl:text-sm text-center leading-snug">
                          {stat.label}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden flex flex-col gap-6">
          {/* Horizontal scrolling tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-all shrink-0 ${
                  active === i
                    ? "bg-white text-black"
                    : "bg-[#1a1a1a] text-neutral-400"
                }`}
              >
                {s.nav}
              </button>
            ))}
          </div>

          {/* Content card */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="bg-[#111111] rounded-2xl p-6 flex flex-col gap-8"
            >
              <div>
                <h2 className="text-white text-xl font-semibold mb-3 leading-tight">
                  {section.title}
                </h2>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {section.description}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {section.stats.map((stat, i) => {
                  const Icon = stat.icon;
                  return (
                    <div key={i} className="flex flex-col items-center gap-2">
                      <div className="w-14 h-14 rounded-full bg-neutral-800 flex items-center justify-center">
                        <Icon size={18} className="text-neutral-400" />
                      </div>
                      <p className="text-neutral-400 text-[11px] text-center leading-snug">
                        {stat.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
