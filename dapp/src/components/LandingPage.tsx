"use client";

import { ArrowRight, Zap, Trophy, Coins } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLeaderboard } from "@/hooks/useLeaderboard";

const FEATURES = [
  {
    icon: <Zap size={20} className="text-indigo-600 dark:text-indigo-400" />,
    title: "Focus Sessions",
    desc: "Pick 10, 25, or 45 minutes — or set your own. Every completed session feeds your pet, earns XP, and moves you up the board.",
  },
  {
    icon: (
      <Coins size={20} className="text-emerald-600 dark:text-emerald-400" />
    ),
    title: "Earn G$ Daily",
    desc: "Verified humans earn GoodDollar (G$) every day — a real universal income. Your focus sessions supercharge the flow.",
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
    title: "Sign in",
    desc: "Sign in with your email or MiniPay — no extra steps needed.",
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
  const { totalUsers } = useLeaderboard();
  const APP_URL =
    typeof window !== "undefined" &&
    window.location.hostname === "focus-pet.xyz"
      ? "https://app.focus-pet.xyz"
      : "/app";

  return (
    <div className="min-h-screen text-white bg-black  overflow-x-hidden">
      <div className="bg-black min-h-screen flex flex-col">
        {/* Nav */}
        <div className="flex justify-between items-center py-6 px-5 sm:py-8 sm:px-10 lg:py-10 lg:px-[80px]">
          <div className="flex items-center gap-x-2">
            {/* <img
              src="/focus-pet-logo.jpeg"
              alt="FocusPet"
              className="w-8 h-8 rounded-full shadow-sm"
            /> */}
            <span className="text-3xl font-anton uppercase">Focus Pet</span>
          </div>
        </div>

        {/* Hero */}
        <div className="flex-1 flex flex-col lg:flex-row lg:items-start gap-10 lg:gap-x-[115px] px-5 sm:px-10 lg:px-20 pt-12 sm:pt-16 lg:pt-[100px] pb-16 relative">
          {/* Left: copy */}
          <div className="w-full lg:max-w-[402px] shrink-0">
            <p className="mb-6 sm:mb-8 lg:mb-10 text-base sm:text-lg lg:text-xl text-neutral-300 max-w-sm">
              FocusPet rewards every completed session with XP and GoodDollar
              (G$) — a digital currency you earn every day. The more you focus, the more
              your pet evolves.
            </p>
            <h1 className="font-anton text-[64px]/[52px] sm:text-[80px]/[58px] lg:text-[100px]/[60px] mb-8 lg:mb-10">
              FOCUS PET
            </h1>
            <Link
              href={APP_URL}
              className="group inline-flex items-center overflow-hidden border border-neutral-700 w-fit"
            >
              <span className="flex items-center justify-center px-[18px] h-12 sm:h-14 bg-[#EDEDED]">
                <ArrowRight
                  size={20}
                  className="text-black transition-transform duration-200 group-hover:translate-x-1"
                />
              </span>
              <span className="px-7 sm:px-10 h-12 sm:h-14 flex items-center bg-white text-black text-base sm:text-lg tracking-tight">
                Get Started
              </span>
            </Link>
          </div>

          {/* Right: stats grid + pets image */}
          <div className="flex-1 flex flex-col gap-6 sm:gap-8 lg:pt-0">
            <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-[#282828] border border-[#282828]">
              <div className="px-5 sm:px-[31px] py-6 sm:py-10">
                <h3 className="text-xl sm:text-2xl font-anton leading-none mb-1">
                  {totalUsers > 0 ? `${totalUsers.toLocaleString()}+` : "350+"}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400">Focusers</p>
              </div>
              <div className="px-5 sm:px-[31px] py-6 sm:py-10">
                <h3 className="text-xl sm:text-2xl font-anton leading-none mb-1">
                  Celo
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400">Network</p>
              </div>
              <div className="px-5 sm:px-[31px] py-6 sm:py-10">
                <h3 className="text-xl sm:text-2xl font-anton leading-none mb-1">
                  GoodDollar
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400">
                  Daily Reward
                </p>
              </div>
              <div className="px-5 sm:px-[31px] py-6 sm:py-10">
                <h3 className="text-xl sm:text-2xl font-anton leading-none mb-1">
                  MiniPay
                </h3>
                <p className="text-xs sm:text-sm text-neutral-400">Mini App</p>
              </div>
            </div>

            <Image
              src="/hero-pets.png"
              width={800}
              height={600}
              alt=""
              className="max-w-sm sm:max-w-md lg:max-w-none lg:absolute lg:bottom-0 lg:right-25 self-center lg:self-auto"
              style={{ width: "auto", height: "auto" }}
            />
          </div>
        </div>
      </div>
      <div className="py-25 flex flex-col items-center bg-[#FBFBFB]">
        <Image
          src="/milestone-images.png"
          width={900}
          height={300}
          alt=""
          className="mb-[33px] w-full max-w-[900px] h-auto"
        />
        <div className="flex justify-center gap-x-[152px] text-[#000000] text-xl">
          <div>1hr</div>
          <div>31hr</div>
          <div>100hrs</div>
          <div>250hrs</div>
        </div>
      </div>

      {/* ── Features ────────────────────────────────────── */}
      <section className="py-16 sm:py-20 lg:py-[120px] px-5 sm:px-10 lg:px-20">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10 sm:divide-x sm:divide-[#282828]">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="sm:pr-10 border-b border-[#282828] sm:border-b-0 pb-8 sm:pb-0 last:border-b-0 last:pb-0"
              >
                <h2 className="font-anton text-xl sm:text-2xl leading-none mb-3">
                  {f.title}
                </h2>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-12 lg:gap-16 px-5 sm:px-10 lg:px-20 py-16 sm:py-20 lg:py-25 bg-[#FBFBFB]">
        <div className="space-y-10 sm:space-y-14 lg:space-y-20 order-2 lg:order-1">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-x-6 sm:gap-x-10">
              <h3 className="shrink-0 text-[#00000033] font-anton text-[64px] sm:text-[80px] lg:text-[100px] leading-none">
                {i + 1}
              </h3>
              <div className="max-w-[402px]">
                <p className="text-lg sm:text-xl lg:text-2xl font-extrabold text-black mb-2 sm:mb-4 lg:mb-6">
                  {s.title}
                </p>
                <p className="text-[#2D2D2D] text-base sm:text-lg lg:text-xl leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        <h1 className="order-1 lg:order-2 text-left lg:text-right text-[56px]/[56px] sm:text-[72px]/[72px] lg:text-[100px]/[100px] text-black font-anton lg:max-w-[402px] uppercase shrink-0">
          Three steps to your first XP
        </h1>
      </section>
      <section className="py-16 sm:py-20 lg:py-30 px-5 sm:px-10 lg:px-20">
        <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 lg:mb-10 max-w-lg">
          Every minute you focus, your egg is growing. What are you waiting for?
        </p>
        <h2 className="text-[56px] sm:text-[72px] lg:text-[100px] leading-none font-anton mb-8 sm:mb-10 uppercase [text-box-trim:trim-both] [text-box-edge:cap_alphabetic]">
          Your pet is waiting to hatch.
        </h2>
        <Link
          href={APP_URL}
          className="group inline-flex items-center overflow-hidden border border-neutral-700 w-fit"
        >
          <span className="flex items-center justify-center px-[18px] h-12 sm:h-14 bg-[#EDEDED]">
            <ArrowRight
              size={20}
              className="text-black transition-transform duration-200 group-hover:translate-x-1"
            />
          </span>
          <span className="px-7 sm:px-10 h-12 sm:h-14 flex items-center bg-white text-black text-base sm:text-lg tracking-tight">
            Get Started
          </span>
        </Link>
      </section>

      <footer className="px-5 sm:px-10 lg:px-20 py-8 border-t border-neutral-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <p className="text-sm text-neutral-400">© {new Date().getFullYear()} FocusPet. All rights reserved.</p>
        <div className="flex items-center gap-6">
          <Link href="/terms" className="text-sm text-neutral-400 hover:text-black transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-sm text-neutral-400 hover:text-black transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}
